import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface UploadResult {
  path: string;
  publicUrl: string;
  bucket: string;
}

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl =
      this.configService.get<string>('SUPABASE_URL') ||
      process.env.SUPABASE_URL ||
      'https://iaitqhnyouqgcmedlony.supabase.co';
    const serviceRoleKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      '';

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * Upload a file directly to a Supabase Storage bucket.
   * Handles images (bucket: 'product-images') and voice notes (bucket: 'voice-notes').
   */
  async uploadFile(
    file: Express.Multer.File,
    bucket: string,
    folder: string = 'crafts',
  ): Promise<UploadResult> {
    try {
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folder}/${Date.now()}-${sanitizedName}`;

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Supabase Storage upload failed for bucket ${bucket}:`, error);
        throw new InternalServerErrorException(
          `Storage upload error: ${error.message}`,
        );
      }

      const {
        data: { publicUrl },
      } = this.supabase.storage.from(bucket).getPublicUrl(data.path);

      this.logger.log(`Uploaded file to ${bucket}/${data.path} successfully.`);

      return {
        path: data.path,
        publicUrl,
        bucket,
      };
    } catch (err: any) {
      this.logger.error('Failed to upload file to Supabase storage:', err);
      throw new InternalServerErrorException(
        err.message || 'File upload to storage failed.',
      );
    }
  }

  /**
   * Upload an in-memory buffer directly to a Supabase Storage bucket.
   * Useful for processed images (Remove.bg) and AI generated assets (Pollinations AI).
   */
  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    bucket: string,
    folder: string = 'crafts',
  ): Promise<UploadResult> {
    try {
      const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folder}/${Date.now()}-${sanitizedName}`;

      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Supabase Storage uploadBuffer failed for bucket ${bucket}:`, error);
        throw new InternalServerErrorException(
          `Storage buffer upload error: ${error.message}`,
        );
      }

      const {
        data: { publicUrl },
      } = this.supabase.storage.from(bucket).getPublicUrl(data.path);

      this.logger.log(`Uploaded buffer to ${bucket}/${data.path} successfully.`);

      return {
        path: data.path,
        publicUrl,
        bucket,
      };
    } catch (err: any) {
      this.logger.error('Failed to upload buffer to Supabase storage:', err);
      throw new InternalServerErrorException(
        err.message || 'Buffer upload to storage failed.',
      );
    }
  }
}
