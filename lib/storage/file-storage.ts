import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { put } from '@vercel/blob'

interface StoredFile {
  fileName: string
  url: string
}

function safeFileName(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function storeOnVercelBlob(userId: string, file: File): Promise<StoredFile> {
  const extension = path.extname(file.name) || '.pdf'
  const fileName = `blood-reports/${userId}/${crypto.randomUUID()}${extension}`

  const blob = await put(fileName, file, {
    access: 'public',
  })

  return {
    fileName,
    url: blob.url,
  }
}

async function storeLocally(userId: string, file: File): Promise<StoredFile> {
  const extension = path.extname(file.name) || '.pdf'
  const targetFolder = path.join(process.cwd(), 'public', 'uploads', 'blood-reports', userId)
  const targetName = `${crypto.randomUUID()}-${safeFileName(path.basename(file.name, extension))}${extension}`
  const targetPath = path.join(targetFolder, targetName)

  await mkdir(targetFolder, { recursive: true })
  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(targetPath, bytes)

  return {
    fileName: targetName,
    url: `/uploads/blood-reports/${userId}/${targetName}`,
  }
}

export async function storeBloodReportFile(userId: string, file: File): Promise<StoredFile> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return storeOnVercelBlob(userId, file)
  }

  return storeLocally(userId, file)
}
