const PDFExtract = require("pdf.js-extract").PDFExtract
const pdfExtract = new PDFExtract()
const options = {} /* see below */
pdfExtract.extract("gitja.pdf", options, (err, data) => {
  if (err) return console.log(err)
  console.log(data.pages[0].content.map((item) => item.str).join(""))
})
