'use client';

import { useRef, useState } from 'react';
import { Avatar } from './avatar';

export interface AvatarUploadProps {
  name: string;
  src?: string | null;
  size?: 48 | 72;
  onFileSelected?: (file: File) => void | Promise<void>;
  disabled?: boolean;
  gradient?: boolean;
}

export function AvatarUpload({
  name,
  src,
  size = 72,
  onFileSelected,
  disabled,
  gradient = true,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const btnSize = size === 72 ? 28 : 22;
  const iconSize = size === 72 ? 13 : 11;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    void onFileSelected?.(file);
  };

  return (
    <div className="relative inline-block">
      <Avatar name={name} src={preview ?? src} size={size} gradient={gradient} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        title="Cambiar foto"
        aria-label="Cambiar foto de perfil"
        className="absolute -bottom-0.5 -right-0.5 rounded-full bg-[var(--surface-3)] border-2 border-[var(--surface)] text-[var(--text-2)] grid place-items-center cursor-pointer transition-colors hover:bg-[var(--brand)] hover:text-[var(--brand-on)] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ width: btnSize, height: btnSize }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
