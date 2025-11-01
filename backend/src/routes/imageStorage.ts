// src/routes/image-storage.ts
import { Elysia, t } from 'elysia';
import { createReadStream, statSync } from 'fs';
import { resolve, sep } from 'path';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  buildSpacesCdnUrl,
  createSpacesClient,
  getSpacesBucket,
  isSpacesConfigured,
} from '../utils/spaces';

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

const imagesRootDir = resolve(process.cwd(), 'src', 'db', 'image'); // ปรับตามโปรเจกต์

export const imageStorageRoutes = new Elysia({ prefix: '/api/images' })

  // 1) GET /api/images/presigned?key=<objectKey>
  //    คืน URL จาก DigitalOcean Spaces หรือ path ของไฟล์โลคัล
  .get(
    '/presigned',
    async ({ query, set }) => {
      try {
        const key = (query as any)?.key as string;
        if (!key || typeof key !== 'string') {
          set.status = 400;
          return { error: 'Missing key' };
        }

        if (isSpacesConfigured()) {
          const bucket = getSpacesBucket();
          const cdnUrl = buildSpacesCdnUrl(key);

          if (cdnUrl) {
            return { url: cdnUrl, bucket };
          }

          const client = createSpacesClient();
          const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          });
          const url = await getSignedUrl(client, command, { expiresIn: 600 });
          return { url, bucket, expiresInSeconds: 600 };
        }

        const localPath = `/api/images/local/${encodeURIComponent(key)}`;
        return { url: localPath, path: localPath };
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

  // 2) GET /api/images/file/<...key> — stream ไฟล์จาก Spaces หรือดิสก์ออกมา
  //    เหมาะกับ Next.js ที่อยากให้โหลดจากแบ็กเอนด์เราเอง (หลบ CORS)
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
  
      if (isSpacesConfigured()) {
        const client = createSpacesClient();
        const bucket = getSpacesBucket();
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        });
        const response = await client.send(command);
        const body = response.Body;

        if (!body) {
          throw new Error('Empty response from Spaces');
        }

        set.status = 200;
        set.headers['Content-Type'] = response.ContentType || guessMime(key);
        set.headers['Cache-Control'] = 'public, max-age=300';
        // @ts-ignore - AWS SDK returns a readable stream for Node.js
        return body;
      }

      // Serve from local filesystem
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
    } catch (e) {
      console.error('Error serving file:', e);
      // ❗อย่าส่ง HTML/JSON ให้ <Image> — ส่งรูป placeholder เล็ก ๆ แทน
      set.status = 404;
      set.headers['Content-Type'] = 'image/svg+xml; charset=utf-8';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>`;
      return svg;
    }
  })
  

  // 3) GET /api/images/local/<...path> — เสิร์ฟไฟล์โลคัล
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
