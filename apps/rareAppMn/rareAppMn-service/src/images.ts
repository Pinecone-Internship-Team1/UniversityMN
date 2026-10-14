import { eq } from 'drizzle-orm';
import type { Database } from './db';
import { images } from './db/schema';
import { getAuthenticatedUser } from './lib/auth';
import type { Env } from './lib/env';

/**
 * Admin image uploads, stored in D1. The admin dashboard resizes pictures in
 * the browser before uploading, so they stay well under the 1 MB request
 * body limit enforced in `src/index.ts`.
 *
 * - `POST /images` (admin only): raw image bytes as the body; responds with
 *   `{ id, url }`, where `url` is what gets saved as e.g. `School.logoUrl`.
 * - `GET /images/:id` (public): serves the stored image.
 */

export const IMAGE_PATH_PATTERN = /^\/images\/([0-9a-f-]{36})$/;

function errorResponse(message: string, status: number): Response {
  return Response.json({ errors: [{ message }] }, { status });
}

function hasPrefix(bytes: Uint8Array, prefix: number[], offset = 0): boolean {
  return prefix.every((byte, index) => bytes[offset + index] === byte);
}

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

/**
 * Detects the image type from its leading bytes rather than trusting the
 * client's Content-Type. SVG is deliberately unsupported: it can carry
 * scripts and would be served from this API's origin.
 */
function detectImageType(bytes: Uint8Array): string | null {
  if (hasPrefix(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (hasPrefix(bytes, ascii('GIF87a')) || hasPrefix(bytes, ascii('GIF89a'))) return 'image/gif';
  if (hasPrefix(bytes, ascii('RIFF')) && hasPrefix(bytes, ascii('WEBP'), 8)) return 'image/webp';
  return null;
}

export async function handleImageUpload(
  request: Request,
  env: Env,
  db: Database
): Promise<Response> {
  const user = await getAuthenticatedUser(request, env);
  if (!user) return errorResponse('You must be signed in to perform this action.', 401);
  if (user.role !== 'admin') {
    return errorResponse('Admin privileges are required for this action.', 403);
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  const contentType = detectImageType(bytes);
  if (!contentType) return errorResponse('Upload a JPEG, PNG, WebP, or GIF image.', 400);

  const [created] = await db
    .insert(images)
    .values({ contentType, data: Buffer.from(bytes) })
    .returning({ id: images.id });
  if (!created) return errorResponse('Could not save the image.', 500);

  const url = new URL(`/images/${created.id}`, request.url).toString();
  return Response.json({ id: created.id, url }, { status: 201 });
}

export async function handleImageRequest(id: string, db: Database): Promise<Response> {
  const [image] = await db
    .select({ contentType: images.contentType, data: images.data })
    .from(images)
    .where(eq(images.id, id))
    .limit(1);
  if (!image) return new Response('Not found', { status: 404 });

  return new Response(image.data, {
    headers: {
      'Content-Type': image.contentType,
      // Each upload gets a fresh id, so an image never changes once stored.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
