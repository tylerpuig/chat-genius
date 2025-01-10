import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  GetBucketLocationCommand,
  PutObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3'
import fs from 'fs/promises'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

async function uploadFile(bucketName: string, fileKey: string, filePath: string) {
  try {
    const client = new S3Client({
      region: 'your-region', // e.g., 'us-west-1'
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })

    // Read file content
    const fileContent = await fs.readFile(filePath)

    // Upload file
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: fileContent,
      // Optionally set content type
      ContentType: 'application/octet-stream' // Adjust based on file type
    })

    await client.send(command)
    console.log(`Successfully uploaded: ${fileKey}`)

    return true
  } catch (error) {
    console.error('Upload error:', error)
    return false
  }
}
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

export async function generatePresignedUrl(fileName: string) {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `uploads/${Date.now()}-${fileName}`
      // ContentType:
    })
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${command.input.Key}`

    return { uploadUrl, fileUrl }
  } catch (error) {
    console.error('Error generating pre-signed URL:', error)
  }
}
