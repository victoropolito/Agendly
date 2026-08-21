import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadSignature {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

/**
 * The browser uploads the image file directly to Cloudinary — it never passes through our own
 * server (avoiding Render's ephemeral disk/memory entirely). This service only hands out a
 * short-lived signed authorization for that upload, scoped to the requesting tenant's own folder.
 */
@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {}

  createUploadSignature(tenantId: string): UploadSignature {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `agendly/${tenantId}`;
    const apiSecret = this.config.getOrThrow<string>('CLOUDINARY_API_SECRET');
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

    return {
      signature,
      timestamp,
      folder,
      apiKey: this.config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      cloudName: this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
    };
  }
}
