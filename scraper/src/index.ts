import { excelToCSV } from "./csv";
import { post } from "./post";
import { scrape } from "./scrape";


const excelDirPath = './downloads/';


async function main() {
    await scrape(excelDirPath)
    const newFilteredDocs = await excelToCSV(excelDirPath)
    if (newFilteredDocs && newFilteredDocs.length > 0) {
        await post(newFilteredDocs)
    }
}

main()
