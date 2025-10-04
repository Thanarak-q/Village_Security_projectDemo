import { Elysia } from 'elysia';
import { createReadStream } from 'fs';
import { join } from 'path';

export const imageStorageRoutes = new Elysia({ prefix: '/api/images' })
  // GET /api/images/debug - Debug MinIO connection and list objects
  .get('/debug', async ({ set }) => {
    try {
      if (process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY) {
        const { Client: MinioClient } = await import('minio');
        const minio = new MinioClient({
          endPoint: process.env.MINIO_ENDPOINT as string,
          port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000,
          useSSL: process.env.MINIO_USE_SSL === 'true',
          accessKey: process.env.MINIO_ACCESS_KEY as string,
          secretKey: process.env.MINIO_SECRET_KEY as string,
        });
        const bucket = process.env.MINIO_BUCKET || 'images';

        // List objects in bucket
        const objects: any[] = [];
        const stream = minio.listObjects(bucket, '', true);

        return new Promise((resolve) => {
          stream.on('data', (obj) => objects.push(obj));
          stream.on('end', () => {
            resolve({
              success: true,
              bucket: bucket,
              objectCount: objects.length,
              objects: objects.slice(0, 10), // First 10 objects
              minioConfig: {
                endpoint: process.env.MINIO_ENDPOINT,
                port: process.env.MINIO_PORT,
                useSSL: process.env.MINIO_USE_SSL
              }
            });
          });
          stream.on('error', (err) => {
            resolve({
              success: false,
              error: err.message,
              bucket: bucket
            });
          });
        });
      } else {
        return {
          success: false,
          error: 'MinIO not configured'
        };
      }
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      };
    }
  })
  // GET /api/images/serve/<path> - Direct image serving (handles both MinIO and local)
  .get('/serve/*', async ({ request, set }) => {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      // Remove /api/images/serve/ prefix to get the key
      const key = pathname.replace('/api/images/serve/', '');

      console.log('🖼️ Image request - Original key:', key);

      if (!key || key === '') {
        set.status = 400;
        return 'Missing key';
      }

      // Decode the key in case it's URL encoded
      const decodedKey = decodeURIComponent(key);
      console.log('🖼️ Image request - Decoded key:', decodedKey);

      if (process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY) {
        console.log('🪣 Using MinIO for image serving');
        const { Client: MinioClient } = await import('minio');
        const minio = new MinioClient({
          endPoint: process.env.MINIO_ENDPOINT as string,
          port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000,
          useSSL: process.env.MINIO_USE_SSL === 'true',
          accessKey: process.env.MINIO_ACCESS_KEY as string,
          secretKey: process.env.MINIO_SECRET_KEY as string,
        });
        const bucket = process.env.MINIO_BUCKET || 'images';

        try {
          console.log(`🔍 Fetching from MinIO - Bucket: ${bucket}, Key: ${decodedKey}`);
          // Get the object from MinIO
          const stream = await minio.getObject(bucket, decodedKey);
          set.headers['Content-Type'] = 'image/jpeg';
          set.headers['Cache-Control'] = 'public, max-age=3600';
          console.log('✅ Image found in MinIO');
          return stream;
        } catch (minioError) {
          console.error('❌ MinIO object not found:', decodedKey, minioError);
          set.status = 404;
          return 'Image not found in MinIO';
        }
      } else {
        console.log('📁 Using local file serving');
        // Fallback to local file serving
        const imagesRootDir = join(process.cwd(), 'src', 'db', 'image');
        const filePath = join(imagesRootDir, decodedKey);
        console.log('📁 Local file path:', filePath);
        set.headers['Content-Type'] = 'image/jpeg';
        set.headers['Cache-Control'] = 'public, max-age=3600';
        return createReadStream(filePath);
      }
    } catch (e) {
      console.error('❌ Error serving image:', e);
      set.status = 404;
      return 'Image not found';
    }
  })
  // GET /api/images/presigned?key=<objectKey>
  .get('/presigned', async ({ query, set }) => {
    try {
      const key = (query as any)?.key as string;
      if (!key || typeof key !== 'string') {
        set.status = 400;
        return { error: 'Missing key' };
      }

      if (process.env.MINIO_ENDPOINT && process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY) {
        const { Client: MinioClient } = await import('minio');
        const minio = new MinioClient({
          endPoint: process.env.MINIO_ENDPOINT as string,
          port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 9000,
          useSSL: process.env.MINIO_USE_SSL === 'true',
          accessKey: process.env.MINIO_ACCESS_KEY as string,
          secretKey: process.env.MINIO_SECRET_KEY as string,
        });
        const bucket = process.env.MINIO_BUCKET || 'images';
        const url = await minio.presignedGetObject(bucket, key, 60 * 10);
        return { url };
      }

      // Fallback: return local-serving path
      return { path: `/api/images/local/${encodeURIComponent(key)}` };
    } catch (e) {
      console.error('Failed to create presigned url', e);
      set.status = 500;
      return { error: 'Failed to create presigned url' };
    }
  })
  // GET /api/images/local/<subfolder>/<filename> - serve local files when MinIO is disabled
  .get('/local/:subfolder/:filename', async ({ params, set }) => {
    try {
      const { subfolder, filename } = params as unknown as { subfolder: string; filename: string };
      const imagesRootDir = join(process.cwd(), 'src', 'db', 'image');
      const filePath = join(imagesRootDir, subfolder, filename);
      set.headers['Content-Type'] = 'image/jpeg';
      return createReadStream(filePath);
    } catch (e) {
      set.status = 404;
      return 'Not found';
    }
  });

export default imageStorageRoutes;


