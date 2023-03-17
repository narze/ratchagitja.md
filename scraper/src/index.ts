import puppeteer from 'puppeteer';
import xlsx from 'node-xlsx';
import { parse as dateParse } from 'date-fns'
const fs = require("fs");
const path = require('path');
const hash = require('object-hash');

const ratchakitchaHome = 'https://ratchakitcha.soc.go.th';
const excelDirPath = './downloads/';
const csvPath = '../data/ratchakitcha.csv';

async function scrape() {
    const browser = await puppeteer.launch({
        ignoreHTTPSErrors: true,
        headless: true,
        devtools: false,
    });

    // get current page
    const page = (await browser.pages())[0];

    // set download behavior
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: excelDirPath });

    await page.goto(ratchakitchaHome, { waitUntil: 'networkidle2' });

    // get monthly selector
    await page.evaluate(async () => {
        const downloadButton = document.getElementsByClassName('btn-monthly-report').item(0) as HTMLButtonElement;
        const monthlySelector = document.getElementById('monthlyreport_month') as HTMLSelectElement;
        const monthlyOptions = monthlySelector.getElementsByTagName('option');

        for (let i = 0; i < monthlyOptions.length; i++) {
            const option = monthlyOptions[i]

            monthlySelector.value = option.value
            monthlySelector.dispatchEvent(new Event('change'));
            await new Promise(resolve => setTimeout(resolve, 1000));

            downloadButton.click();
            // TODO: listen download finished instead of delay
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    });

    await browser.close();
}

type Row = [string, string, string, string, string, string, string, string, string];
type Rows = Row[];

async function excelToCSV() {
    const headers: Row = ['วันที่', 'เรื่อง', 'เล่ม', 'ตอน', 'ประเภท', 'หน้า', 'เล่มที่', 'URL', 'id'];

    let rows: Rows = [];

    // read old csv if exists
    const oldCSVExists = fs.existsSync(csvPath);
    if (oldCSVExists) {
        const oldCSVFile = fs.readFileSync(csvPath, { encoding: 'utf8', flag: 'r' });
        let oldCSVRows = oldCSVFile.split('\n').map(row => row.split(','));

        // validate headers
        if (JSON.stringify(oldCSVRows[0]) != JSON.stringify(headers)) {
            throw new Error(`headers unmathed current: ${oldCSVRows[0]} new: ${headers}`);
        }

        // pop headers
        oldCSVRows.shift();

        rows = oldCSVRows
    }

    fs.readdirSync(excelDirPath, { withFileTypes: true, defval: "" })
        .filter(item => !item.isDirectory())
        .filter(item => item.name.endsWith('.xlsx'))
        .map(item => {
            const workSheets = xlsx.parse(path.join(excelDirPath, item.name));
            workSheets.forEach(workSheet => {
                workSheet.data.forEach((rawRow: (string | number)[], index) => {
                    if (index == 0) return
                    if (rawRow.length == 0) return

                    // change all columns to string
                    let row: Row = rawRow.map(col => col.toString()) as Row

                    // clean title that can break the csv
                    if (row[1]) {
                        row[1] = row[1].replace(/(\r\n|\n|\r|\,)/gm, '')
                    }

                    // generate id by hash ('เล่ม', 'ตอน', 'ประเภท', 'หน้า', 'เล่มที่')
                    const hashId = hash(row.slice(2, 7))

                    // skip if the id exists
                    let updateIndex = -1
                    const exist = rows.some((r, index) => {
                        if (r[8].localeCompare(hashId) === 0) {
                            // check if pdf url updated
                            if (r[7] != row[7]) {
                                updateIndex = index
                            }
                            return true
                        }
                        return false
                    })
                    if (exist) {
                        if (updateIndex >= 0) {
                            console.log(`found a ducument update ${row}`)
                            rows[updateIndex][0] = row[0]
                            rows[updateIndex][1] = row[1]
                            rows[updateIndex][7] = row[7]
                        }
                        return
                    }

                    if (oldCSVExists) {
                        console.log(`found a new document ${row}`)
                    }

                    // add id column
                    row.push(hashId)
                    rows.push(row)
                })
            })
        })

    // sort csv by multi factors
    rows = rows.sort((a, b) => {
        const dateAStr = a[0]
        const dateBStr = b[0]

        const dateA = dateParse(dateAStr, 'dd/MM/yyyy', 0);
        const dateB = dateParse(dateBStr, 'dd/MM/yyyy', 0);

        // sort by date descending order
        const dateDiff = dateB.getTime() - dateA.getTime()
        if (dateDiff != 0) {
            return dateDiff;
        }
        // sort by 'เล่ม'
        if (a[2].localeCompare(b[2])) {
            return parseInt(b[2]) - parseInt(a[2]);
        }
        // sort by 'ตอน'
        if (a[3].localeCompare(b[3])) {
            return parseInt(b[3]) - parseInt(a[3]);
        }
        // sort by 'ประเภท'
        if (a[4].localeCompare(b[4])) {
            return b[4] > a[4] ? 1 : -1;
        }
        // sort by 'หน้า'
        if (a[5].localeCompare(b[5])) {
            return parseInt(b[5]) - parseInt(a[5]);
        }
        // sort by 'id'
        return b[8] > a[8] ? 1 : -1;
    })

    // add headers
    rows = [headers, ...rows]

    // generate csv
    const csv = rows.map(row => row.join(',')).join('\n')
    fs.writeFileSync(csvPath, csv, 'utf8');
}

async function main() {
    await scrape()
    await excelToCSV()
}

main()
