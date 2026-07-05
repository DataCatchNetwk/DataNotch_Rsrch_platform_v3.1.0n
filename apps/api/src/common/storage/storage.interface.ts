export interface IStorageProvider {
  /**
   * Upload a file to storage
   * @param bucket Bucket name
   * @param path File path within the bucket
   * @param buffer File content
   * @param metadata Optional metadata
   */
  upload(bucket: string, path: string, buffer: Buffer, metadata?: Record<string, string>): Promise<string>;

  /**
   * Download a file from storage
   * @param bucket Bucket name
   * @param path File path within the bucket
   */
  download(bucket: string, path: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   * @param bucket Bucket name
   * @param path File path within the bucket
   */
  delete(bucket: string, path: string): Promise<void>;

  /**
   * Check if a file exists
   * @param bucket Bucket name
   * @param path File path within the bucket
   */
  exists(bucket: string, path: string): Promise<boolean>;

  /**
   * Get a public URL for a file
   * @param bucket Bucket name
   * @param path File path within the bucket
   */
  getPublicUrl(bucket: string, path: string): string;

  /**
   * Get a signed URL for a file (for temporary access)
   * @param bucket Bucket name
   * @param path File path within the bucket
   * @param expiresIn Expiration time in seconds
   */
  getSignedUrl(bucket: string, path: string, expiresIn?: number): Promise<string>;

  /**
   * List files in a directory
   * @param bucket Bucket name
   * @param prefix Directory prefix
   */
  list(bucket: string, prefix: string): Promise<string[]>;
}
