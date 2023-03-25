
import xlsx from 'node-xlsx';
import { parse as dateParse } from 'date-fns'
import { headerIdx, Row, Rows } from './type';
import { filterByStartWith } from './filter';
const fs = require("fs");
const path = require('path');
const hash = require('object-hash');

const csvPath = '../data/ratchakitcha.csv';
const filteredCSVPath = '../data/ratchakitcha_filtered.csv';

const headers: Row = ['วันที่', 'เรื่อง', 'เล่ม', 'ตอน', 'ประเภท', 'หน้า', 'เล่มที่', 'URL', 'id'];

export async function excelToCSV(excelDirPath: string): Promise<Rows | void> {
    let rows: Rows = [];
    let newDocs: Rows = [];

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

    let idMap = {};
    rows.forEach((row, index) => {
        idMap[row[headerIdx.id]] = index
    })

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
                    if (row[headerIdx.title]) {
                        row[headerIdx.title] = row[headerIdx.title].replace(/(\r\n|\n|\r|\,)/gm, '')
                    }

                    // generate id by hash ('เล่ม', 'ตอน', 'ประเภท', 'หน้า', 'เล่มที่')
                    const hashId = hash(row.slice(2, 7))

                    // skip if the id existing
                    if (idMap[hashId] != undefined) {
                        const oldIndex = idMap[hashId];

                        if (row[headerIdx.url] != rows[oldIndex][headerIdx.url]) {
                            // update document if the url changed
                            console.log(`found a document update ${row}`)
                            
                            rows[oldIndex][headerIdx.date] = row[headerIdx.date]
                            rows[oldIndex][headerIdx.title] = row[headerIdx.title]
                            rows[oldIndex][headerIdx.url] = row[headerIdx.url]
                        }

                        return
                    }
                    
                    // add id column
                    row.push(hashId)

                    if (oldCSVExists) {
                        console.log(`found a new document ${row}`)
                        newDocs.push(row)
                    }

                    rows.push(row)
                })
            })
        })

    // sort csv by multi factors
    rows = rows.sort((a, b) => {
        const dateAStr = a[headerIdx.date]
        const dateBStr = b[headerIdx.date]

        const dateA = dateParse(dateAStr, 'dd/MM/yyyy', headerIdx.date);
        const dateB = dateParse(dateBStr, 'dd/MM/yyyy', headerIdx.date);

        // sort by date descending order
        const dateDiff = dateB.getTime() - dateA.getTime()
        if (dateDiff != 0) {
            return dateDiff;
        }
        // sort by 'เล่ม'
        if (a[headerIdx.volume].localeCompare(b[headerIdx.volume])) {
            return parseInt(b[headerIdx.volume]) - parseInt(a[headerIdx.volume]);
        }
        // sort by 'ตอน'
        if (a[headerIdx.section].localeCompare(b[headerIdx.section])) {
            return parseInt(b[headerIdx.section]) - parseInt(a[headerIdx.section]);
        }
        // sort by 'ประเภท'
        if (a[headerIdx.category].localeCompare(b[headerIdx.category])) {
            return b[headerIdx.category] > a[headerIdx.category] ? 1 : -1;
        }
        // sort by 'หน้า'
        if (a[headerIdx.page].localeCompare(b[headerIdx.page])) {
            return parseInt(b[headerIdx.page]) - parseInt(a[headerIdx.page]);
        }
        // sort by 'id'
        return b[headerIdx.id] > a[headerIdx.id] ? 1 : -1;
    })

    // add headers
    rows = [headers, ...rows]

    const filteredRows = filterByStartWith(rows)

    // generate csv
    fs.writeFileSync(csvPath, rows.map(row => row.join(',')).join('\n'), 'utf8');

    // generate filtered csv
    if (filteredRows) {
        fs.writeFileSync(filteredCSVPath, filteredRows.map(row => row.join(',')).join('\n'), 'utf8');
    }

    return filterByStartWith(newDocs);
}
