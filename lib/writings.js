// lib/writings.js - Utility functions for reading writing content
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'

const writingsDirectory = path.join(process.cwd(), 'content/writings')

export function getAllWritingIds() {
  const fileNames = fs.readdirSync(writingsDirectory)
  return fileNames.map(fileName => {
    // Support both .md and .html files
    const id = fileName.replace(/\.(md|html)$/, '')
    return {
      params: {
        id
      }
    }
  })
}

export function getAllWritings() {
  try {
    const fileNames = fs.readdirSync(writingsDirectory)
    console.log('Found files:', fileNames)
    
    const allWritingsData = fileNames.map(fileName => {
      // Support both .md and .html files
      const id = fileName.replace(/\.(md|html)$/, '')
      const fileExtension = path.extname(fileName)

      // Read file as string
      const fullPath = path.join(writingsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')

      // Use gray-matter to parse the post metadata section
      const matterResult = matter(fileContents)

      // Combine the data with the id and file type
      return {
        id,
        fileExtension,
        ...matterResult.data
      }
    })

    console.log('Parsed writings:', allWritingsData)

    // Sort writings by year (newest first)
    return allWritingsData.sort((a, b) => {
      if (a.year < b.year) {
        return 1
      } else if (a.year > b.year) {
        return -1
      } else {
        return 0
      }
    })
  } catch (error) {
    console.error('Error in getAllWritings:', error)
    return []
  }
}

export async function getWritingData(id) {
  // Try to find the file with either .md or .html extension
  let fullPath
  let fileExtension
  
  if (fs.existsSync(path.join(writingsDirectory, `${id}.html`))) {
    fullPath = path.join(writingsDirectory, `${id}.html`)
    fileExtension = '.html'
  } else if (fs.existsSync(path.join(writingsDirectory, `${id}.md`))) {
    fullPath = path.join(writingsDirectory, `${id}.md`)
    fileExtension = '.md'
  } else {
    throw new Error(`Writing file not found for id: ${id}`)
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)

  let contentHtml
  if (fileExtension === '.html' || matterResult.data.contentType === 'html') {
    // For HTML files or HTML content, return the raw content without processing
    contentHtml = matterResult.content
  } else {
    // For regular markdown content
    const processedContent = await remark()
      .use(html)
      .process(matterResult.content)
    contentHtml = processedContent.toString()
  }

  // Combine the data with the id and contentHtml
  return {
    id,
    contentHtml,
    fileExtension,
    ...matterResult.data
  }
} 