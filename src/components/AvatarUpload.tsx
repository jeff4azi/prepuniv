import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { useAuth } from "../context/AuthContext";
import { uploadAvatar, AvatarUploadError } from "../lib/avatarUpload";

interface AvatarUploadProps {
  /** Called with a friendly message when compression/upload/save fails. */
  onError?: (message: string) => void;
  /** Called after the new avatar has been saved to the profile. */
  onSuccess?: () => void;
}

/**
 * The current user's avatar, with a small camera button that opens the
 * file picker and runs the compress → upload → save flow. Clicking the
 * avatar image itself still opens the enlarge overlay (Avatar's default
 * behavior) — the camera button is a separate, non-conflicting tap target
 * for changing the photo.
 */
export function AvatarUpload({ onError, onSuccess }: AvatarUploadProps) {
  const { currentUser, updateProfilePatch } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so choosing the same file again still fires onChange.
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadAvatar(
        currentUser.id,
        file,
        currentUser.avatar_url,
      );
      const { error } = await updateProfilePatch({ avatar_url: url });
      if (error) {
        throw new AvatarUploadError(
          error.message || "Uploaded, but couldn't save it to your profile.",
        );
      }
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof AvatarUploadError
          ? err.message
          : "Something went wrong uploading your photo.";
      onError?.(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="relative inline-flex shrink-0">
      <Avatar
        name={currentUser.full_name}
        src={currentUser.avatar_url ?? undefined}
        size="xl"
        ring
        className="h-20 w-20 text-xl ring-cream ring-4 shadow-elevated"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Change profile photo"
        className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-cream flex items-center justify-center shadow-soft border-2 border-cream disabled:opacity-60 active:scale-95 transition-transform"
      >
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Camera className="w-3.5 h-3.5" strokeWidth={2.2} />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
