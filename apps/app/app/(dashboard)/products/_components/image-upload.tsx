"use client";

import { useState, useCallback } from "react";
import { Button } from "@repo/ui/button";
import { cn } from "@/lib/utils";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type ImageUploadProps = {
  value?: string;
  onChange: (url: string) => void;
  onClear?: () => void;
  disabled?: boolean;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

export function ImageUpload({ value, onChange, onClear, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format file tidak didukung. Gunakan JPG, PNG, atau WebP.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Ukuran file terlalu besar. Maksimal 5MB.");
      return false;
    }
    return true;
  };

  const uploadImage = async (base64Image: string) => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/dashboard/upload/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          folder: "products",
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const data = await res.json();
      onChange(data.data.url);
      toast.success("Gambar berhasil diupload");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengupload gambar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!validateFile(file)) return;
      
      try {
        const base64 = await fileToBase64(file);
        await uploadImage(base64);
      } catch (error) {
        toast.error("Gagal membaca file");
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (disabled || isUploading) return;
      
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [disabled, isUploading, handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      e.target.value = ""; // Reset input
    },
    [handleFileSelect]
  );

  if (value) {
    return (
      <div className="relative w-full aspect-square max-w-[200px] rounded-lg border border-border overflow-hidden group">
        <Image
          src={value}
          alt="Product image"
          fill
          className="object-cover"
          sizes="200px"
        />
        {!disabled && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Ganti
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onClear}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
              Hapus
            </Button>
          </div>
        )}
        <input
          id="image-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled && !isUploading) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative w-full aspect-video max-w-[300px] rounded-lg border-2 border-dashed",
        "flex flex-col items-center justify-center gap-2 p-6",
        "transition-colors cursor-pointer",
        isDragging && "border-primary bg-primary/5",
        !isDragging && "border-border hover:border-muted-foreground",
        (disabled || isUploading) && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && !isUploading && document.getElementById("image-upload")?.click()}
    >
      {isUploading ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Mengupload...</p>
        </>
      ) : (
        <>
          <div className="rounded-full bg-muted p-3">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Klik atau drag gambar</p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WebP (max 5MB)
            </p>
          </div>
        </>
      )}
      <input
        id="image-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}
