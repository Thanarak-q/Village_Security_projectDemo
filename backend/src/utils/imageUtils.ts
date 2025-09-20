import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Save base64 image data to the db/images directory
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param filename - Optional filename, if not provided will generate UUID
 * @returns Promise<string> - The filename of the saved image
 */
export async function saveBase64Image(base64Data: string, filename?: string): Promise<string> {
  try {
    // Ensure db/images directory exists
    const imagesDir = join(process.cwd(), 'src', 'db', 'images');
    await mkdir(imagesDir, { recursive: true });

    // Remove data URL prefix if present (data:image/jpeg;base64,)
    const base64Content = base64Data.includes(',') 
      ? base64Data.split(',')[1] 
      : base64Data;

    // Generate filename if not provided
    const imageFilename = filename || `${uuidv4()}.jpg`;
    const imagePath = join(imagesDir, imageFilename);

    // Convert base64 to buffer and save
    const imageBuffer = Buffer.from(base64Content, 'base64');
    await writeFile(imagePath, imageBuffer);

    console.log(`✅ Image saved: ${imageFilename}`);
    return imageFilename;
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
