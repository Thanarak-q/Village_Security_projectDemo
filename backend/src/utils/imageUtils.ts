import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Client as MinioClient } from 'minio';

/**
 * Save base64 image data to the db/images directory
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param filename - Optional filename, if not provided will generate UUID
 * @returns Promise<string> - The filename of the saved image
 */
export async function saveBase64Image(
  base64Data: string,
  filename?: string,
  subfolder?: string
): Promise<string> {
  try {
    // Remove data URL prefix if present (data:image/jpeg;base64,)
    const base64Content = base64Data.includes(',') 
      ? base64Data.split(',')[1] 
      : base64Data;

    // Generate filename if not provided
    const imageFilename = filename || `${uuidv4()}.jpg`;
    const targetSubfolder = subfolder || 'misc';

    // Detect content-type from data URL if present
    let contentType = 'image/jpeg';
    const ctMatch = base64Data.match(/^data:(image\/[a-zA-Z.+-]+);base64,/);
    if (ctMatch && ctMatch[1]) {
      contentType = ctMatch[1];
    }

    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(base64Content, 'base64');

    // If MINIO is configured, upload there; otherwise, save to local disk
    const useMinio = Boolean(process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY);
    if (useMinio) {
      const minio = new MinioClient({
        endPoint: process.env.MINIO_ENDPOINT as string,
        port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000,
        useSSL: process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY as string,
        secretKey: process.env.MINIO_SECRET_KEY as string,
      });

      const bucket = process.env.MINIO_BUCKET || 'images';
      const objectKey = `${targetSubfolder}/${imageFilename}`;

      const exists = await minio.bucketExists(bucket).catch(() => false);
      if (!exists) {
        await minio.makeBucket(bucket, 'us-east-1');
      }

      await minio.putObject(bucket, objectKey, imageBuffer, imageBuffer.length, {
        'Content-Type': contentType,
      });

      console.log(`✅ Image uploaded to MinIO: ${objectKey}`);
      // Return object key; callers should treat this as key, not local path
      return objectKey;
    } else {
      // Fallback to local disk in src/db/image/<subfolder>
      const imagesRootDir = join(process.cwd(), 'src', 'db', 'image');
      const targetDir = join(imagesRootDir, targetSubfolder);
      await mkdir(targetDir, { recursive: true });
      const imagePath = join(targetDir, imageFilename);
      await writeFile(imagePath, imageBuffer);
      console.log(`✅ Image saved locally: ${join(targetSubfolder, imageFilename)}`);
      return join(targetSubfolder, imageFilename);
    }
  } catch (error) {
    console.error('❌ Error saving image:', error);
    throw new Error('Failed to save image');
  }
}

/**
 * Extract file extension from base64 data URL
 * @param base64Data - Base64 encoded image data with data URL prefix
 * @returns string - File extension (e.g., 'jpg', 'png')
 */
export function getImageExtension(base64Data: string): string {
  if (base64Data.startsWith('data:image/')) {
    const match = base64Data.match(/data:image\/([a-zA-Z]+);base64,/);
    return match ? match[1] : 'jpg';
  }
  return 'jpg'; // default to jpg
}
