import type { Env } from "../config";

export async function storePhoto(
  env: Env,
  telegramId: number,
  type: "food" | "progress" | "form_check" | "label",
  buffer: ArrayBuffer
): Promise<string> {
  const timestamp = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const key = `${telegramId}/${type}/${timestamp}-${rand}.jpg`;

  await env.PHOTOS.put(key, buffer, {
    httpMetadata: { contentType: "image/jpeg" },
  });

  return key;
}

export function getPhotoUrl(env: Env, key: string): string {
  return `${env.PHOTOS_PUBLIC_URL}/${key}`;
}
