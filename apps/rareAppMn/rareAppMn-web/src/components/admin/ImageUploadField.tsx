"use client";

import { useAuth } from "@clerk/nextjs";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
  IMAGE_UPLOAD_ACCEPT,
  ImageUploadError,
  resizeImage,
  uploadImage,
} from "@/lib/image-upload";
import { cn } from "@/lib/utils";

export interface ImageUploadFieldProps {
  label: string;
  /** The current image URL, or "" when there is none. */
  value: string;
  onChange: (url: string) => void;
  /** Lets the form block saving while an upload is still in flight. */
  onUploadingChange: (uploading: boolean) => void;
  /** "logo" keeps transparency and shows a square preview; "cover" a wide one. */
  variant: "logo" | "cover";
  /** Longest side, in pixels, the picture is scaled down to before upload. */
  maxSize: number;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  onUploadingChange,
  variant,
  maxSize,
}: ImageUploadFieldProps) {
  const { getToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    setErrorMessage(null);
    setUploading(true);
    onUploadingChange(true);
    try {
      const image = await resizeImage(file, maxSize, variant === "logo");
      onChange(await uploadImage(image, await getToken()));
    } catch (error) {
      const message =
        error instanceof ImageUploadError
          ? error.message
          : "Зургийг оруулж чадсангүй. Дахин оролдоно уу.";
      setErrorMessage(message);
      toast.error("Зураг оруулж чадсангүй", { description: message });
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
      {label}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink/10 bg-paper text-ink/30",
            variant === "logo" ? "h-20 w-20" : "h-20 w-36",
          )}
        >
          {value ? (
            <img
              src={value}
              alt=""
              className={cn(
                "h-full w-full",
                variant === "logo" ? "object-contain p-1.5" : "object-cover",
              )}
            />
          ) : (
            <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-paper/70">
              <Loader2 className="h-5 w-5 animate-spin text-ink/60" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {uploading ? "Оруулж байна..." : value ? "Солих" : "Зураг оруулах"}
          </Button>
          {value && (
            <Button variant="ghost" size="sm" disabled={uploading} onClick={() => onChange("")}>
              <X className="h-3.5 w-3.5" />
              Арилгах
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_UPLOAD_ACCEPT}
        className="hidden"
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Reset so picking the same file again still fires onChange.
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      {errorMessage && <p className="font-medium text-destructive">{errorMessage}</p>}
    </div>
  );
}
