import { createClient } from '@supabase/supabase-js';
import { IStorageProvider } from './storage.interface.js';

/**
 * Supabase Storage provider
 * Used for production cloud deployments
 */
export class SupabaseStorageProvider implements IStorageProvider {
  private supabaseUrl: string;
  private supabaseKey: string;
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseServiceKey;
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  async upload(bucket: string, filePath: string, buffer: Buffer, metadata?: Record<string, string>): Promise<string> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        upsert: true,
        contentType: metadata?.contentType || 'application/octet-stream',
      });

    if (error) {
      throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    return filePath;
  }

  async download(bucket: string, filePath: string): Promise<Buffer> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      throw new Error(`Failed to download from Supabase: ${error.message}`);
    }

    if (!data) {
      throw new Error(`No data returned from Supabase`);
    }

    return Buffer.from(await data.arrayBuffer());
  }

  async delete(bucket: string, filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete from Supabase: ${error.message}`);
    }
  }

  async exists(bucket: string, filePath: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(filePath.split('/').slice(0, -1).join('/') || '.');

      if (error) return false;
      if (!data) return false;

      const fileName = filePath.split('/').pop();
      return data.some(file => file.name === fileName);
    } catch {
      return false;
    }
  }

  getPublicUrl(bucket: string, filePath: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async getSignedUrl(bucket: string, filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    if (!data) {
      throw new Error(`No signed URL returned`);
    }

    return data.signedUrl;
  }

  async list(bucket: string, prefix: string): Promise<string[]> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(prefix);

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data
      .filter(file => file.name !== '.emptyFolderPlaceholder')
      .map(file => `${prefix}/${file.name}`.replace(/^\//, ''));
  }
}
