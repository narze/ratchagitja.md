import { excelToCSV } from "./csv";
import { post } from "./post";
import { scrape } from "./scrape";


const excelDirPath = './downloads/';


async function main() {
    await scrape(excelDirPath)
    const newDocs = await excelToCSV(excelDirPath)
    if (newDocs && newDocs.length > 0) {
        await post(newDocs)
    }
}

main()
