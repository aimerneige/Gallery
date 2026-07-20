import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface R2Config {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  publicUrlPrefix?: string;
}

export function getR2ConfigFromEnv(): R2Config {
  return {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || 'nicogallery',
    publicUrlPrefix: process.env.R2_PUBLIC_URL_PREFIX || '',
  };
}

export async function uploadToR2(
  buffer: Buffer,
  filename: string,
  config: R2Config
): Promise<string> {
  const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrlPrefix } = config;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      'Cloudflare R2 credentials (ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET_NAME) are missing. Please configure them in Settings before uploading.'
    );
  }

  try {
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const key = `photos/${filename}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
      })
    );

    if (publicUrlPrefix) {
      const cleanPrefix = publicUrlPrefix.endsWith('/') ? publicUrlPrefix.slice(0, -1) : publicUrlPrefix;
      return `${cleanPrefix}/${key}`;
    }

    return `${endpoint}/${bucketName}/${key}`;
  } catch (err: any) {
    throw new Error(`Cloudflare R2 upload failed: ${err.message}`);
  }
}
