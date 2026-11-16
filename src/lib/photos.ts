import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

/**
 * Re-draws the picture as a fresh JPEG. This drops all hidden data in the
 * original file (GPS location, phone model, time taken) before upload, and
 * keeps files small.
 */
async function cleanImage(uri: string, maxSide = 1440): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width: maxSide });
  const rendered = await ctx.renderAsync();
  const result = await rendered.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return result.uri;
}

async function uploadJpeg(bucket: 'photos' | 'verifications', userId: string, uri: string) {
  const path = `${userId}/${Crypto.randomUUID()}.jpg`;
  const bytes = await new File(uri).arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

// Photos picked on this phone, so they show instantly while the upload's link is fetched.
const localPreviews = new Map<string, string>();
export function localPreview(path: string) {
  return localPreviews.get(path);
}

export async function pickProfilePhoto(userId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Allow photo access in Settings to add pictures.');
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 5],
    quality: 1,
    exif: false,
  });
  if (res.canceled || !res.assets[0]) return null;
  const clean = await cleanImage(res.assets[0].uri);
  const path = await uploadJpeg('photos', userId, clean);
  localPreviews.set(path, clean);
  return path;
}

export async function takeVerificationSelfie(userId: string): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error('Allow camera access in Settings to verify your profile.');
  const res = await ImagePicker.launchCameraAsync({
    cameraType: ImagePicker.CameraType.front,
    quality: 0.9,
    exif: false,
  });
  if (res.canceled || !res.assets[0]) return null;
  const clean = await cleanImage(res.assets[0].uri, 1080);
  return uploadJpeg('verifications', userId, clean);
}

export async function deletePhoto(path: string) {
  await supabase.storage.from('photos').remove([path]);
}

/** Deletes every file the user owns. Used before deleting the account. */
export async function deleteAllMyFiles(userId: string) {
  for (const bucket of ['photos', 'verifications'] as const) {
    const { data } = await supabase.storage.from(bucket).list(userId, { limit: 100 });
    if (data?.length) {
      await supabase.storage.from(bucket).remove(data.map((f) => `${userId}/${f.name}`));
    }
  }
}

// Short-lived links (1 hour) to private photos, cached so we ask once.
const cache = new Map<string, { url: string; expires: number }>();
const LINK_SECONDS = 3600;

export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now();
  const out: Record<string, string> = {};
  const missing: string[] = [];
  for (const p of paths) {
    const hit = cache.get(p);
    if (hit && hit.expires > now + 60_000) out[p] = hit.url;
    else missing.push(p);
  }
  if (missing.length) {
    const { data } = await supabase.storage.from('photos').createSignedUrls(missing, LINK_SECONDS);
    for (const item of data ?? []) {
      if (item.signedUrl && item.path) {
        cache.set(item.path, { url: item.signedUrl, expires: now + LINK_SECONDS * 1000 });
        out[item.path] = item.signedUrl;
      }
    }
  }
  return out;
}
