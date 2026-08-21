'use client';

import * as React from 'react';

import { staffApi } from '@/lib/staff-api';
import type { UploadSignature } from '@/lib/types';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Uploads a file straight from the browser to Cloudinary — it never passes through our server. */
export function useCloudinaryUpload() {
  const [isUploading, setIsUploading] = React.useState(false);

  async function upload(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Envie um arquivo de imagem (PNG, JPG, etc).');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('A imagem deve ter no máximo 5MB.');
    }

    setIsUploading(true);
    try {
      const signature = await staffApi.post<UploadSignature>('/tenant/me/upload-signature');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signature.apiKey);
      formData.append('timestamp', String(signature.timestamp));
      formData.append('signature', signature.signature);
      formData.append('folder', signature.folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Não foi possível enviar a imagem. Tente novamente.');
      }
      const body = (await response.json()) as { secure_url: string };
      return body.secure_url;
    } finally {
      setIsUploading(false);
    }
  }

  return { upload, isUploading };
}
