import { S3Client } from '@aws-sdk/client-s3';

export const isSpacesConfigured = () =>
  Boolean(
    process.env.SPACES_ENDPOINT &&
      process.env.SPACES_ACCESS_KEY &&
      process.env.SPACES_SECRET_KEY &&
      process.env.SPACES_BUCKET
  );

export const createSpacesClient = () =>
  new S3Client({
    endpoint: process.env.SPACES_ENDPOINT,
    region: process.env.SPACES_REGION || 'us-east-1',
    forcePathStyle: false,
    credentials: {
      accessKeyId: process.env.SPACES_ACCESS_KEY as string,
      secretAccessKey: process.env.SPACES_SECRET_KEY as string,
    },
  });

export const getSpacesBucket = () => process.env.SPACES_BUCKET as string;

const PUBLIC_ACLS = new Set(['public-read', 'public-read-write']);

const encodeKeyForUrl = (key: string) =>
  key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

const isPublicAcl = () => {
  const acl = (process.env.SPACES_OBJECT_ACL || '').toLowerCase();
  return PUBLIC_ACLS.has(acl);
};

export const buildSpacesCdnUrl = (key: string) => {
  if (!isPublicAcl()) {
    return null;
  }

  const cdnEndpoint = process.env.SPACES_CDN_ENDPOINT;
  if (cdnEndpoint) {
    return `${cdnEndpoint.replace(/\/$/, '')}/${encodeKeyForUrl(key)}`;
  }
  return null;
};
