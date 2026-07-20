import sharp from 'sharp';

export interface ProcessedImageResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
}

export async function processImage(
  inputBuffer: Buffer,
  options: { maxDimension?: number; quality?: number } = {}
): Promise<ProcessedImageResult> {
  const maxDimension = options.maxDimension || 1600;
  const quality = options.quality || 80;

  let pipeline = sharp(inputBuffer).rotate(); // auto-rotate based on EXIF

  const metadata = await pipeline.metadata();
  let width = metadata.width || 1920;
  let height = metadata.height || 1080;

  // Resize if larger than maxDimension
  if (width > maxDimension || height > maxDimension) {
    pipeline = pipeline.resize({
      width: width > height ? maxDimension : undefined,
      height: height >= width ? maxDimension : undefined,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert to WebP
  pipeline = pipeline.webp({ quality });

  const buffer = await pipeline.toBuffer();
  const finalMeta = await sharp(buffer).metadata();

  return {
    buffer,
    width: finalMeta.width || width,
    height: finalMeta.height || height,
    format: 'webp',
  };
}
