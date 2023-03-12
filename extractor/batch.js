const PDFExtract = require("pdf.js-extract").PDFExtract
const axios = require("axios")
const csv = require("csv-parser")
const matter = require("gray-matter")
const fs = require("fs")
const path = require("path")

const filePath = "../data/ratchakitcha.csv"
const filterCriterias = ["ก"]

const results = []

const force = process.argv.includes("--force")

fs.createReadStream(filePath)
  .pipe(csv())
  .on("data", (row) => {
    if (filterCriterias.includes(row.ประเภท)) {
      if (results.length < 5) {
        // Limit to 5 for testing
        results.push(row)
      }
    }
  })
  .on("end", async () => {
    // console.log(results)

    await Promise.all(
      results.map(async (entry) => {
        const filename = path.basename(entry.URL, ".pdf")

        if (fs.existsSync(`../entries/${filename}.md`) && !force) {
          console.log(`${filename}.md already exist`)
          console.log("Use --force to override the files")
        } else {
          return await downloadAndExtract(filename, entry)
        }
      })
    )
  })

async function downloadAndExtract(filename, entry) {
  const {
    วันที่: date,
    เรื่อง: name,
    เล่ม: volume,
    หน้า: page,
    เล่มที่: subPage,
    ตอน: section,
    ประเภท: category,
    URL: url,
  } = entry

  const template = fs.readFileSync("../TEMPLATE.md", "utf8")

  const { data: templateData, content: _newContent } = matter(template)

  const data = Object.assign({}, templateData)

  data.name = name
  data.date = new Date(date).toISOString().split("T")[0]
  data.category = category
  data.volume = +volume
  data.section = +section
  data.page = subPage ? `${page} ${subPage}` : +page
  data.source = url
  data.draft = true

  const pdfExtract = new PDFExtract()
  const options = {} /* see below */

  const response = await axios.get(url, { responseType: "arraybuffer" })
  const buffer = Buffer.from(response.data)

  const pdfData = await pdfExtract.extractBuffer(buffer, options)

  const content = [
    `\n# ${name}`,
    ...pdfData.pages.map((page) =>
      page.content
        .map((item) => item.str)
        .join(" ")
        .replace(/[ ]า/g, "ำ")
        .replace(/\s+/g, " ")
    ),
  ].join("\n\n")

  const newFrontmatter = matter.stringify(content, data)

  fs.writeFileSync(`../entries/${filename}.md`, unsarabun(newFrontmatter))

  console.log(`${filename}.md created`)
}

function unsarabun(content) {
  return content.replace(/[๐-๙]/g, (match) => {
    return match.charCodeAt(0) - 3664
  })
}
