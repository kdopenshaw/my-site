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
    return {
      params: {
        id: fileName.replace(/\.md$/, '')
      }
    }
  })
}

export function getAllWritings() {
  try {
    const fileNames = fs.readdirSync(writingsDirectory)
    console.log('Found files:', fileNames)
    
    const allWritingsData = fileNames.map(fileName => {
      // Remove ".md" from file name to get id
      const id = fileName.replace(/\.md$/, '')

      // Read markdown file as string
      const fullPath = path.join(writingsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')

      // Use gray-matter to parse the post metadata section
      const matterResult = matter(fileContents)

      // Combine the data with the id
      return {
        id,
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
  const fullPath = path.join(writingsDirectory, `${id}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)

  // Check if this is HTML content
  const isHtmlContent = matterResult.data.contentType === 'html'

  let contentHtml
  if (isHtmlContent) {
    // For HTML content, return the raw content without processing
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
    ...matterResult.data
  }
} 