import { headerIdx, Rows } from "./type";
const fs = require("fs");

const filerPath = '../data/filter.json';

const data = fs.readFileSync(filerPath, 'utf-8');
const jsonData = JSON.parse(data);
const filter_startwiths = jsonData.filter_startwiths;

export function filterByStartWith(rows: Rows): Rows | void {
    rows = rows.filter(row => {
        return !filter_startwiths.some(prefix => row[headerIdx.title].startsWith(prefix));
    })

    return rows;
}
