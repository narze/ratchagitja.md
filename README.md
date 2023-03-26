# Ratchagitja.md

แปลงราชกิจจานุเบกษา ให้เป็นรูปแบบที่คอมพิวเตอร์อ่านและประมวลผลต่อได้ง่ายขึ้น

![Ratchagitja Midjourney Cover](/data/assets/cover.jpg)

## Rules

- แปลงตรงตามตัวอักษร
- ตัวเลขไทยทั้งหมดแปลงเป็นเลขอารบิก (ใช้ [UnSarabun](https://github.com/narze/unsarabun.js) ช่วยได้)
- Example [Template](TEMPLATE.md)
- มี Metadata ที่จำเป็น (ใช้ [YAML Frontmatter](https://markdoc.dev/docs/frontmatter))
  - name: ซื่อประกาศ
  - date: วันที่ yyyy-mm-dd
  - category: ประเภท
  - volume: เล่ม
  - section: ตอนที่
  - page: หน้า
  - source: URL ที่มาของประกาศ
  - อื่นๆ (ถ้ามี)
- ตัดข้อมูลที่ไม่จำเป็นออกไป เช่น หัวกระดาษ (Page Header)

\* หมายเหตุ

ถ้ามีข้อมูลที่แปลงเป็นตัวอักษรไม่ได้ เช่น รูปภาพ หรือ ตารางข้อมูลที่มีขนาดใหญ่มาก ให้เขียนเป็นหมายเหตุเอาไว้ก่อน แล้วจะแก้ไขให้เป็น Markdown หรือ HTML ต่อไป

## System design

```mermaid
C4Component
  System_Ext(ratchakitcha, "Ratchakitcha Website")
  System_Ext(facebook, "Facebook")

  Boundary(b1, "Ratchagitja systems") {
    System(scraper, "Scraper")
    System(extractor, "Extractor")
  }

  Boundary(b2, "Git repository") {
    ComponentDb(csv, "CSV file")
    ComponentDb(markdown, "Markdown files")
  }

  Rel(scraper, ratchakitcha, "download Excel")
  Rel(scraper, facebook, "craete post")
  Rel(scraper, csv, "generate")
  Rel(extractor, markdown, "generate")
```

# Workflows

```mermaid
flowchart TB
  subgraph Scraper
    download(Download Excel)
    convert(Convert to CSV)
    filters(Filter CSV)
    post(Post to Facebook)
    download --> convert
    convert --> filters
    filters --> post
  end
  subgraph Extractor
    load(Read CSV)
    pdf(Downlaod PDF)
    extract(Extract PDF)
    save(Save to Markdown)
    filters --> load
    load --> pdf
    pdf --> extract
    extract --> save
  end
```

## Project layout

```tree
├── data
│   ├── filter.json                      - list of filters by title start with
│   ├── ratchakitcha.csv                 - list of ratchakitcha CSV file
│   ├── ratchakitcha_filtered.csv        - filtered list of ratchakitcha CSV file
├── entries                              - ratchakitcha Markdown files, path `category/volume/section/id.md`
│   ├── ก                                - categories directories
|   │   ├── 139                          - volumes directories
|   │   │   ├── 61                       - sections directories
|   │   │   │   ├── 17224570.md          - ratchakitcha Markdown file
├── extractor                            - extractor script for download PDF and extract to Markdown files           
└── scraper                              - scraper script for download Excel and parser to CSV
```

## Contribution

- เลือกราชกิจจานุเบกษาจากเว็บไซต์ https://ratchakitcha.soc.go.th แปลงเป็น Markdown หรือ txt แล้วเปิด Pull Request
- สร้าง Issue เพื่อเสนอแนะ หรือ แจ้งปัญหา
- ช่วยกันตรวจสอบความถูกต้องของข้อมูลใน Pull Request
