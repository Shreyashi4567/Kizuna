/**
 * Supabase Storage Service for KIZUNA.
 * Handles persistent photographic evidence for Citizen Reports and Authority Resolutions.
 * Storage structure:
 *   - report-images/{reportId}/defect.{ext}
 *   - resolution-images/{reportId}/resolution.{ext}
 * Compatible with Web and Future Mobile App (Flutter / React Native).
 */

import { getServerSupabase } from './server';

export interface StorageUploadResult {
  publicUrl: string;
  storagePath: string | null;
}

/**
 * Uploads a base64 image or data URL to Supabase Storage.
 * Gracefully falls back if storage bucket is pending or unreachable.
 */
export async function uploadImageToSupabaseStorage(
  base64OrUrl: string,
  bucketName: 'report-images' | 'resolution-images',
  reportId: string,
  fileSlug: string = 'image'
): Promise<StorageUploadResult> {
  // If already an HTTP/HTTPS URL (e.g. demo image), return as-is
  if (!base64OrUrl || base64OrUrl.startsWith('http://') || base64OrUrl.startsWith('https://')) {
    return {
      publicUrl: base64OrUrl,
      storagePath: null,
    };
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return {
      publicUrl: base64OrUrl,
      storagePath: null,
    };
  }

  try {
    // Extract MIME type and clean base64 data
    const mimeMatch = base64OrUrl.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const cleanBase64 = base64OrUrl.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, '');

    // Convert base64 string to binary Buffer
    const buffer = Buffer.from(cleanBase64, 'base64');

    // Determine extension
    let extension = 'jpg';
    if (mimeType.includes('png')) extension = 'png';
    else if (mimeType.includes('webp')) extension = 'webp';

    const storagePath = `${reportId}/${fileSlug}.${extension}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn(`Supabase Storage upload to "${bucketName}/${storagePath}" notice:`, error.message);
      // Fallback to data URL so the report is never lost
      return {
        publicUrl: base64OrUrl,
        storagePath: null,
      };
    }

    // Retrieve public URL
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
    return {
      publicUrl: urlData.publicUrl,
      storagePath: `${bucketName}/${storagePath}`,
    };
  } catch (err) {
    console.warn('Supabase storage upload exception:', err);
    return {
      publicUrl: base64OrUrl,
      storagePath: null,
    };
  }
}
