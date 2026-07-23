import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface StorageConfig {
  storageType?: 'r2' | 'minio';
  // R2 specific
  accountId?: string;
  // MinIO / generic S3 specific
  minioEndpoint?: string;
  minioRegion?: string;
  minioUsePathStyle?: boolean;
  // Shared S3 credentials
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName?: string;
  publicUrlPrefix?: string;
}

export function getStorageConfigFromEnv(): StorageConfig {
  return {
    storageType: (process.env.STORAGE_TYPE as 'r2' | 'minio') || 'r2',
    accountId: process.env.R2_ACCOUNT_ID || '',
    minioEndpoint: process.env.MINIO_ENDPOINT || '',
    minioRegion: process.env.MINIO_REGION || 'us-east-1',
    minioUsePathStyle: process.env.MINIO_USE_PATH_STYLE !== 'false', // default to true
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || process.env.MINIO_SECRET_ACCESS_KEY || '',
    bucketName: process.env.STORAGE_BUCKET_NAME || process.env.R2_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || 'nicogallery',
    publicUrlPrefix: process.env.STORAGE_PUBLIC_URL_PREFIX || process.env.R2_PUBLIC_URL_PREFIX || process.env.MINIO_PUBLIC_URL_PREFIX || '',
  };
}

// Aliases for backward compatibility in codebase
export type R2Config = StorageConfig;
export const getR2ConfigFromEnv = getStorageConfigFromEnv;

// StorageProvider represents the abstract interface for uploading gallery image files.
export interface StorageProvider {
  upload(buffer: Buffer, filename: string): Promise<string>;
}

// R2StorageProvider implements StorageProvider interface for Cloudflare R2.
export class R2StorageProvider implements StorageProvider {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async upload(buffer: Buffer, filename: string): Promise<string> {
    const { accountId, accessKeyId, secretAccessKey, bucketName, publicUrlPrefix } = this.config;

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
}

// MinioStorageProvider implements StorageProvider interface for MinIO / S3 compatible storage.
export class MinioStorageProvider implements StorageProvider {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async upload(buffer: Buffer, filename: string): Promise<string> {
    const { minioEndpoint, minioRegion, minioUsePathStyle, accessKeyId, secretAccessKey, bucketName, publicUrlPrefix } = this.config;

    if (!minioEndpoint || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error(
        'MinIO configurations (ENDPOINT, ACCESS_KEY_ID, SECRET_ACCESS_KEY, BUCKET_NAME) are missing. Please configure them in Settings before uploading.'
      );
    }

    try {
      const s3 = new S3Client({
        region: minioRegion || 'us-east-1',
        endpoint: minioEndpoint,
        forcePathStyle: minioUsePathStyle !== false,
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

      const cleanEndpoint = minioEndpoint.endsWith('/') ? minioEndpoint.slice(0, -1) : minioEndpoint;
      if (minioUsePathStyle !== false) {
        return `${cleanEndpoint}/${bucketName}/${key}`;
      } else {
        if (cleanEndpoint.startsWith('https://')) {
          const clean = cleanEndpoint.replace('https://', '');
          return `https://${bucketName}.${clean}/${key}`;
        } else if (cleanEndpoint.startsWith('http://')) {
          const clean = cleanEndpoint.replace('http://', '');
          return `http://${bucketName}.${clean}/${key}`;
        }
        return `${cleanEndpoint}/${bucketName}/${key}`;
      }
    } catch (err: any) {
      throw new Error(`MinIO upload failed: ${err.message}`);
    }
  }
}

// getStorageProvider instantiates and returns the selected StorageProvider (R2 or MinIO).
export function getStorageProvider(): StorageProvider {
  const config = getStorageConfigFromEnv();
  if (config.storageType === 'minio') {
    return new MinioStorageProvider(config);
  }
  return new R2StorageProvider(config);
}
