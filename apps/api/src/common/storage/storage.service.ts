import { env } from '../../config/env.js';
import { IStorageProvider } from './storage.interface.js';
import { LocalStorageProvider } from './storage.local.js';
import { SupabaseStorageProvider } from './storage.supabase.js';

let storageService: IStorageProvider | null = null;

export function initializeStorageProvider(): IStorageProvider {
  if (storageService) {
    return storageService;
  }

  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

  if (provider === 'supabase') {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Supabase storage requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables'
      );
    }

    storageService = new SupabaseStorageProvider(supabaseUrl, supabaseKey);
    console.log('Initialized Supabase Storage Provider');
  } else if (provider === 'local') {
    storageService = new LocalStorageProvider();
    console.log('Initialized Local Storage Provider');
  } else {
    throw new Error(`Unknown storage provider: ${provider}`);
  }

  return storageService;
}

export function getStorageProvider(): IStorageProvider {
  if (!storageService) {
    return initializeStorageProvider();
  }
  return storageService;
}

export { IStorageProvider, LocalStorageProvider, SupabaseStorageProvider };
