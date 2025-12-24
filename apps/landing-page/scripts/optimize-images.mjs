#!/usr/bin/env node

import sharp from 'sharp'
import { readdir, stat } from 'fs/promises'
import { join, extname, basename } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PUBLIC_DIR = join(__dirname, '..', 'public')
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png']

// Configuration for different image types
const OPTIMIZATION_CONFIG = {
  'background.jpg': {
    width: 1920,
    height: 1080,
    quality: 85,
    format: 'webp',
  },
  'me.jpg': {
    width: 800,
    height: 800,
    quality: 90,
    format: 'webp',
  },
  'impliedvol.jpeg': {
    width: 800,
    height: 800,
    quality: 85,
    format: 'webp',
  },
}

async function getFileSize(filePath) {
  const stats = await stat(filePath)
  return stats.size
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

async function optimizeImage(inputPath, config) {
  const fileName = basename(inputPath)
  const outputPath = inputPath.replace(extname(inputPath), `.${config.format}`)

  console.log(`\n📸 Optimizing ${fileName}...`)

  try {
    const originalSize = await getFileSize(inputPath)
    console.log(`   Original: ${formatBytes(originalSize)}`)

    await sharp(inputPath)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center',
      })
      .toFormat(config.format, {
        quality: config.quality,
      })
      .toFile(outputPath)

    const optimizedSize = await getFileSize(outputPath)
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1)

    console.log(`   Optimized: ${formatBytes(optimizedSize)}`)
    console.log(
      `   💾 Saved: ${savings}% (${formatBytes(originalSize - optimizedSize)})`
    )
    console.log(`   ✅ Created: ${basename(outputPath)}`)

    return { originalSize, optimizedSize, savings }
  } catch (error) {
    console.error(`   ❌ Error optimizing ${fileName}:`, error.message)
    return null
  }
}

async function main() {
  console.log('🎨 Image Optimization Script')
  console.log('==============================\n')

  const files = await readdir(PUBLIC_DIR)
  const imageFiles = files.filter((file) =>
    IMAGE_EXTENSIONS.includes(extname(file).toLowerCase())
  )

  console.log(`Found ${imageFiles.length} image(s) to optimize\n`)

  let totalOriginal = 0
  let totalOptimized = 0
  let processedCount = 0

  for (const file of imageFiles) {
    const config = OPTIMIZATION_CONFIG[file]
    if (config) {
      const inputPath = join(PUBLIC_DIR, file)
      const result = await optimizeImage(inputPath, config)
      if (result) {
        totalOriginal += result.originalSize
        totalOptimized += result.optimizedSize
        processedCount++
      }
    } else {
      console.log(`⏭️  Skipping ${file} (no optimization config)`)
    }
  }

  if (processedCount > 0) {
    console.log('\n==============================')
    console.log('📊 Optimization Summary')
    console.log('==============================')
    console.log(`Images processed: ${processedCount}`)
    console.log(`Total original size: ${formatBytes(totalOriginal)}`)
    console.log(`Total optimized size: ${formatBytes(totalOptimized)}`)
    console.log(
      `Total savings: ${((1 - totalOptimized / totalOriginal) * 100).toFixed(1)}% (${formatBytes(totalOriginal - totalOptimized)})`
    )
    console.log('✨ Done!\n')
  } else {
    console.log('\n⚠️  No images were optimized\n')
  }
}

main().catch((error) => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})
