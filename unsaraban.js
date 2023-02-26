const fs = require("fs")

// specify the file path as a command line argument
const filePath = process.argv[2]

try {
  // use the fs module to read the contents of the file synchronously
  const data = fs.readFileSync(filePath, "utf8")

  // use a regular expression to replace all Thai numbers with Arabic numbers
  const arabicData = data.replace(
    /[๐-๙]/g,
    (match) => match.charCodeAt(0) - 3664
  )

  // use the fs module to write the modified contents back to the same file
  fs.writeFileSync(filePath, arabicData, "utf8")
  console.log("File saved.")
} catch (err) {
  console.error(err)
}
