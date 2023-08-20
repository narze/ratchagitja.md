import { defineCollection, z } from "astro:content"

const blog = defineCollection({
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string to Date object
    pubDate: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
    updatedDate: z
      .string()
      .optional()
      .transform((str) => (str ? new Date(str) : undefined)),
    heroImage: z.string().optional(),
  }),
})

const ratchagitja = defineCollection({
  schema: z.object({
    // วันที่: date,
    // เรื่อง: name,
    // เล่ม: volume,
    // หน้า: page,
    // เล่มที่: subPage,
    // ตอน: section,
    // ประเภท: category,
    // URL: url,
    เรื่อง: z.string().optional(),
    name: z.string().optional(),
    วันที่: z
      .string()
      .or(z.date())
      .optional()
      .transform((str) => (str ? new Date(str) : undefined)),
    date: z
      .string()
      .or(z.date())
      .optional()
      .transform((str) => (str ? new Date(str) : undefined)),
    เล่ม: z.string().or(z.number()).optional(),
    volume: z.string().or(z.number()).optional(),
    หน้า: z.string().or(z.number()).optional(),
    page: z.string().or(z.number()).optional(),
    เล่มที่: z.string().or(z.number()).optional(),
    subPage: z.string().or(z.number()).optional(),
    ตอน: z.string().or(z.number()).optional(),
    section: z.string().or(z.number()).optional(),
    source: z.string(),
  }),
})

export const collections = { blog, ratchagitja }
