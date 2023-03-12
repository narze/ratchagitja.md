const csv = require("csv-parser")
const fs = require("fs")
const path = require("path")

const filePath = "../data/ratchakitcha.csv"
const filterCriterias = ["ก"]

const results = []

fs.createReadStream(filePath)
  .pipe(csv())
  .on("data", (row) => {
    if (filterCriterias.includes(row.ประเภท)) {
      results.push(row)
    }
  })
  .on("end", () => {
    // console.log(results)

    results.forEach(
      ({
        วันที่: date,
        เรื่อง: name,
        เล่ม: volume,
        เล่มที่: sub_volume,
        ตอน: section,
        ประเภท: category,
        URL: url,
      }) => {
        // Skip if file is already exist
        const filename = path.basename(url, ".pdf")

        if (fs.existsSync(`../data/pdf/${filename}.pdf`)) {
          console.log(`${filename}.pdf already exist`)
        } else {
          // TODO: Create new file from TEMPLATE.md
          // const template = fs.readFileSync("../data/TEMPLATE.md", "utf8")

          console.log({
            date,
            name,
            volume,
            sub_volume,
            section,
            category,
            url,
          })
        }
      }
    )
  })
