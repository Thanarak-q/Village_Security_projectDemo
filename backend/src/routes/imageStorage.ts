// src/routes/image-storage.ts
import { Elysia, t } from 'elysia';
import { createReadStream, statSync } from 'fs';
import { join, resolve, sep } from 'path';

// (เล็ก ๆ น้อย ๆ) เดา mime แบบเบา ๆ ถ้าไม่มีไลบรารี
const guessMime = (filename: string) => {
  const ext = filename.toLowerCase().split('.').pop() || '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
};

// แปลง env เป็นพารามิเตอร์ของ MinIO client ที่ถูกต้อง แม้จะส่งมาเป็น URL
const parseMinioEnv = () => {
  const raw = process.env.MINIO_ENDPOINT || '';
  let endPoint = raw;
  let port = process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : undefined;
  let useSSL = process.env.MINIO_USE_SSL === 'true';

  try {
    // ถ้า MINIO_ENDPOINT เป็น URL เช่น http://127.0.0.1:9000 หรือ https://minio.local
    const u = new URL(raw);
    endPoint = u.hostname;
    port = Number(u.port) || (u.protocol === 'https:' ? 443 : 80);
    useSSL = u.protocol === 'https:';
  } catch {
    // ไม่ใช่ URL -> ให้ถือว่าเป็น hostname ธรรมดา
    // ถ้าไม่กำหนด port ให้ใช้ 9000 เป็นดีฟอลต์
    if (!port) port = 9000;
  }

  return { endPoint, port, useSSL };
};

const imagesRootDir = resolve(process.cwd(), 'src', 'db', 'image'); // ปรับตามโปรเจกต์

export const imageStorageRoutes = new Elysia({ prefix: '/api/images' })

  // 1) GET /api/images/presigned?key=<objectKey>
  //    คืน pre-signed URL จาก MinIO (หมดอายุ 10 นาที)
  .get(
    '/presigned',
    async ({ query, set }) => {
      try {
        const key = (query as any)?.key as string;
        if (!key || typeof key !== 'string') {
          set.status = 400;
          return { error: 'Missing key' };
        }

        if (
          process.env.MINIO_ACCESS_KEY &&
          process.env.MINIO_SECRET_KEY &&
          (process.env.MINIO_ENDPOINT || process.env.MINIO_PORT)
        ) {
          const { Client: MinioClient } = await import('minio');
          const { endPoint, port, useSSL } = parseMinioEnv();

          const minio = new MinioClient({
            endPoint,
            port: port ?? 9000,
            useSSL,
            accessKey: process.env.MINIO_ACCESS_KEY!,
            secretKey: process.env.MINIO_SECRET_KEY!,
          });

          const bucket = process.env.MINIO_BUCKET || 'images';

          // เพิ่ม response headers (เช่น content-type) ผ่าน query ของ presign ก็ได้
          const reqParams = { 'response-content-type': 'image/*' };
          const url = await minio.presignedGetObject(bucket, key, 60 * 10, reqParams);

          return { url, expiresInSeconds: 600 };
        }

        // Fallback: ใช้ local path
        return { path: `/api/images/local/${encodeURIComponent(key)}` };
      } catch (e) {
        console.error('Failed to create presigned url', e);
        set.status = 500;
        return { error: 'Failed to create presigned url' };
      }
    },
    {
      query: t.Object({ key: t.String() }),
    }
  )

  // 2) GET /api/images/file/<...key> — proxy/stream ไฟล์จาก MinIO ออกมา
  //    เหมาะกับ Next.js ที่อยากให้โหลดจากแบ็กเอนด์เราเอง (หลบ CORS + ซ่อนโดเมน MinIO)
  .get('/file/*', async ({ params, set }) => {
    try {
      // ✅ decode key ที่มาจาก URL เช่น .../%E0%B8%AB%E0%...
      const raw = (params['*'] as string) || '';
      const key = decodeURIComponent(raw);
      
      if (!key) {
        set.status = 400;
        set.headers['Content-Type'] = 'image/svg+xml; charset=utf-8';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`;
        return svg;
      }
  
      // Check if MinIO is configured
      if (
        process.env.MINIO_ACCESS_KEY &&
        process.env.MINIO_SECRET_KEY &&
        (process.env.MINIO_ENDPOINT || process.env.MINIO_PORT)
      ) {
        // Use MinIO
        const { Client: MinioClient } = await import('minio');
        const { endPoint, port, useSSL } = parseMinioEnv();

        const minio = new MinioClient({
          endPoint,
          port: port ?? 9000,
          useSSL,
          accessKey: process.env.MINIO_ACCESS_KEY!,
          secretKey: process.env.MINIO_SECRET_KEY!,
        });

        const bucket = process.env.MINIO_BUCKET || 'images';

        // Check if file exists
        await minio.statObject(bucket, key);

        // Get the object stream
        const stream = await minio.getObject(bucket, key);

        set.status = 200;
        set.headers['Content-Type'] = guessMime(key);
        set.headers['Cache-Control'] = 'public, max-age=300';
        // @ts-ignore
        return stream;
      } else {
        // Fallback to local file system
        const resolved = resolve(imagesRootDir, key);
        if (!resolved.startsWith(imagesRootDir + sep)) {
          set.status = 403;
          set.headers['Content-Type'] = 'image/svg+xml; charset=utf-8';
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`;
          return svg;
        }

        const st = statSync(resolved);
        if (!st.isFile()) {
          throw new Error('Not a file');
        }

        set.status = 200;
        set.headers['Content-Type'] = guessMime(key);
        set.headers['Cache-Control'] = 'public, max-age=300';
        return createReadStream(resolved);
      }
    } catch (e) {
      console.error('Error serving file:', e);
      // ❗อย่าส่ง HTML/JSON ให้ <Image> — ส่งรูป placeholder เล็ก ๆ แทน
      set.status = 404;
      set.headers['Content-Type'] = 'image/svg+xml; charset=utf-8';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`;
      return svg;
    }
  })
  

  // 3) GET /api/images/local/<...path> — เสิร์ฟไฟล์โลคัล (เมื่อยังไม่ตั้งค่า MinIO)
  //    ป้องกัน path traversal และเดา MIME ให้
  .get('/local/*', async ({ params, set }) => {
    try {
      const rel = (params['*'] as string) || '';
      if (!rel) {
        set.status = 400;
        return { error: 'Missing path' };
      }

      // sanitize path
      const resolved = resolve(imagesRootDir, rel);
      if (!resolved.startsWith(imagesRootDir + sep)) {
        set.status = 403;
        return { error: 'Forbidden' };
      }

      const st = statSync(resolved);
      if (!st.isFile()) {
        set.status = 404;
        return { error: 'Not found' };
      }

      set.headers['Content-Type'] = guessMime(resolved);
      set.headers['Cache-Control'] = 'public, max-age=300';
      return createReadStream(resolved);
    } catch (e) {
      set.status = 404;
      return { error: 'Not found' };
    }
  });

export default imageStorageRoutes;
