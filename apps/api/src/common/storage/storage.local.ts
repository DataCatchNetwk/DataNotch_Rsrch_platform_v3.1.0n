import fs from 'node:fs';
import path from 'node:path';
import { IStorageProvider } from './storage.interface.js';

/**
 * Local filesystem storage provider
 * Used for development and testing
 */
export class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = baseDir;
  }

  private getBucketPath(bucket: string): string {
    return path.join(this.baseDir, 'storage', bucket);
  }

  private getFilePath(bucket: string, filePath: string): string {
    const bucketPath = this.getBucketPath(bucket);
    const fullPath = path.resolve(bucketPath, filePath);
    
    // Prevent directory traversal attacks
    if (!fullPath.startsWith(bucketPath)) {
      throw new Error(`Unsafe path: ${filePath}`);
    }
    
    return fullPath;
  }

  private ensureDir(dirPath: string): void {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  async upload(bucket: string, filePath: string, buffer: Buffer, metadata?: Record<string, string>): Promise<string> {
    const fullPath = this.getFilePath(bucket, filePath);
    this.ensureDir(path.dirname(fullPath));
    
    fs.writeFileSync(fullPath, buffer);
    
    // Optionally write metadata
    if (metadata) {
      const metaPath = `${fullPath}.meta.json`;
      fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
    }
    
    return filePath;
  }

  async download(bucket: string, filePath: string): Promise<Buffer> {
    const fullPath = this.getFilePath(bucket, filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    return fs.readFileSync(fullPath);
  }

  async delete(bucket: string, filePath: string): Promise<void> {
    const fullPath = this.getFilePath(bucket, filePath);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    
    // Also delete metadata if it exists
    const metaPath = `${fullPath}.meta.json`;
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }
  }

  async exists(bucket: string, filePath: string): Promise<boolean> {
    try {
      const fullPath = this.getFilePath(bucket, filePath);
      return fs.existsSync(fullPath);
    } catch {
      return false;
    }
  }

  getPublicUrl(bucket: string, filePath: string): string {
    // For local storage, return a relative URL
    // In real usage, this would be served by Express static middleware
    return `/storage/${bucket}/${filePath}`;
  }

  async getSignedUrl(bucket: string, filePath: string, expiresIn?: number): Promise<string> {
    // For local storage, signed URLs are not applicable
    // Return the same as public URL
    return this.getPublicUrl(bucket, filePath);
  }

  async list(bucket: string, prefix: string): Promise<string[]> {
    const bucketPath = this.getBucketPath(bucket);
    const prefixPath = path.join(bucketPath, prefix);
    
    if (!fs.existsSync(prefixPath)) {
      return [];
    }
    
    const entries = fs.readdirSync(prefixPath, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile())
      .map(entry => path.join(prefix, entry.name));
  }
}
