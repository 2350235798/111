'use client';
import { uploadApi } from '@client/src/api/app';

export interface UploadFileData {
  id: string;
  filePath: string;
  bucketId: string;
  url: string;
}

export async function uploadFile(file: File): Promise<UploadFileData> {
  const url = await uploadApi.image(file);
  return {
    id: url,
    filePath: url,
    bucketId: 'vercel-blob',
    url,
  };
}
