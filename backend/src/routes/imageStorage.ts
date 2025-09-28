import { Elysia } from 'elysia';
import { createReadStream } from 'fs';
import { join } from 'path';

export const imageStorageRoutes = new Elysia({ prefix: '/api/images' })
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


