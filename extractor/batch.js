const PDFExtract = require("pdf.js-extract").PDFExtract
const { parse } = require("date-fns")
const axios = require("axios")
const csv = require("csv-parser")
const matter = require("gray-matter")
const fs = require("fs")
const path = require("path")

const filePath = "../data/ratchakitcha_filtered.csv"

const results = []

const force = process.argv.includes("--force")
let silent = false;

fs.createReadStream(filePath)
  .pipe(csv())
  .on("data", (row) => {
    results.push(row)
  })
  .on("end", async () => {
    await Promise.all(
      results.map(async (entry) => {
        if (!entry.URL) {
          return
        }
        const filename = path.basename(entry.URL, ".pdf")
        const dirPath = `../entries/${entry.ประเภท}/${entry.เล่ม}/${entry.ตอน}`
        const filePath = path.join(dirPath, `${filename}.md`)

        // Create the directory if it doesn't exist
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        if (fs.existsSync(filePath) && !force) {
          if (!silent) {
            console.log(`${filename}.md already exist`)
            console.log("Use --force to override the files")
            silent = true
          }
          return
        }
        try {
          return await downloadAndExtract(filePath, entry)
        } catch (err) {
          console.error(`error to download and extract ${filename}: ${err.message}`)
        }
      })
    )
  })

async function downloadAndExtract(filePath, entry) {
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
  data.date = parse(date, "dd/MM/yyyy", 0).toISOString().split("T")[0]
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

  fs.writeFileSync(filePath, unsarabun(newFrontmatter))

  console.log(`${filePath} created`)
}

// ref: https://github.com/kiznick/ratchagitja.pdf2md/blob/76f2487225541fd99fd5d62198fcee81d4ef144c/index.js#L51
const glossary = {
  ' า': 'ำ',
  'หนา  ': 'หน้า ',
  'เลม  ': 'เล่ม ',
  'เจา': 'เจ้า',
  'ทรัพย': 'ทรัพย์',
  'ทักษ': 'ทักษ์',
  'ลม': 'ล้ม',
  'จันทร': 'จันทร์',
  'ทิพย': 'ทิพย์',
  'รัตน': 'รัตน์',
  'แต': 'แต่',
  'อยู': 'อยู่',
  'บาน': 'บ้าน',
  'หมู': 'หมู่',
  'มา': 'ม้า',
  'ได': 'ได้',
  'ฟอง': 'ฟ้อง',
  'ตอ': 'ต่อ',
  'ดวย': 'ด้วย',
  'ให': 'ให้',
  'แลว': 'แล้ว',
  'รักษ': 'รักษ์',
  'ผู': 'ผู้',
  'เปน': 'เป็น',
  'หนา': 'หน้า',
  'ผู': 'ผู้',
  'แหง': 'แห่ง',
  'โจทก': 'โจทก์',
  'ตอง': 'ต้อง',
  'ฝาย': 'ฝ่าย',
  'คู': 'คู่',
  'ไม': 'ไม่',
  'ไซต': 'ไซต์',
  'กลุม': 'กลุ่ม',

  '๑': '1',
  '๒': '2',
  '๓': '3',
  '๔': '4',
  '๕': '5',
  '๖': '6',
  '๗': '7',
  '๘': '8',
  '๙': '9',
  '๐': '0',
}

const glossaryRegex = new RegExp(Object.keys(glossary).join('|'), 'g');

// unsarabun replace all string by glossary
function unsarabun(content) {
  return content.replace(glossaryRegex, (match) => glossary[match]);
}
