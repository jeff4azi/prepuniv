import imageCompression from "browser-image-compression";
import { supabase } from "./supabase";

/** User-facing error from the avatar upload flow — message is safe to show as-is. */
export class AvatarUploadError extends Error {}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Reject outright above this, pre-compression, so a huge file doesn't hang
// the browser trying to compress it.
const MAX_PRE_COMPRESS_BYTES = 20 * 1024 * 1024; // 20MB

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.15,
  maxWidthOrHeight: 512,
  useWebWorker: true,
};

function extFromFile(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

/**
 * Given a previously-stored avatar's public URL, recover its path
 * *within* the `avatars` bucket (i.e. `{user_id}/{filename}`), so it
 * can be passed to `storage.remove()`. Returns null if the URL doesn't
 * look like one of ours (nothing to clean up in that case).
 */
function storagePathFromPublicUrl(url: string, userId: string): string | null {
  const marker = `/avatars/${userId}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const rest = url.slice(idx + marker.length).split(/[?#]/)[0];
  if (!rest) return null;
  return `${userId}/${rest}`;
}

/**
 * Validates, client-side compresses, and uploads a new avatar image for
 * `userId`, updates nothing itself (the caller persists the resulting URL
 * to `profiles.avatar_url`), and best-effort cleans up `previousAvatarUrl`
 * in Storage once the new upload succeeds. Throws AvatarUploadError with a
 * message safe to show directly to the user.
 */
export async function uploadAvatar(
  userId: string,
  file: File,
  previousAvatarUrl?: string | null,
): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new AvatarUploadError(
      "Please choose a JPG, PNG, or WEBP image.",
    );
  }
  if (file.size > MAX_PRE_COMPRESS_BYTES) {
    throw new AvatarUploadError(
      "That image is too large — please choose one under 20MB.",
    );
  }

  let compressed: File;
  try {
    compressed = await imageCompression(file, COMPRESSION_OPTIONS);
  } catch {
    throw new AvatarUploadError(
      "Couldn't process that image — try a different file.",
    );
  }

  const path = `${userId}/${crypto.randomUUID()}.${extFromFile(file)}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, compressed, {
      contentType: compressed.type || file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    throw new AvatarUploadError(
      "Upload failed — check your connection and try again.",
    );
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  // Best-effort cleanup of the old avatar object. Never blocks success —
  // the new avatar is already live at this point.
  if (previousAvatarUrl) {
    const oldPath = storagePathFromPublicUrl(previousAvatarUrl, userId);
    if (oldPath) {
      supabase.storage
        .from("avatars")
        .remove([oldPath])
        .catch((err) =>
          console.warn("Failed to clean up previous avatar:", err),
        );
    }
  }

  return publicUrl;
}
