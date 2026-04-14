'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api-client';
import { UserAvatar } from '@/components/shared/user-avatar';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export default function PerfilPage() {
  const { user, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Tipo de archivo no permitido. Use JPG, PNG o WebP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('El archivo supera el tamaño máximo de 2MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    uploadFile(file);
  }, []);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiFetch('/v1/usuarios/me/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || 'Error al subir avatar');
      }

      const { data } = await res.json();
      updateUserProfile({ avatarUrl: data.avatarUrl });
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir avatar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    setError(null);

    try {
      const res = await apiFetch('/v1/usuarios/me/avatar', { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message || 'Error al eliminar avatar');
      }

      updateUserProfile({ avatarUrl: null });
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar avatar');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  const displayName = user.nombre
    ? `${user.nombre} ${user.apellido ?? ''}`.trim()
    : user.email;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#091426] dark:text-white mb-6">Mi Perfil</h1>

      <div className="bg-white dark:bg-[#162a4a] rounded-xl border border-[#e2e8f0] dark:border-white/10 p-6">
        {/* Avatar section */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <UserAvatar
                nombre={user.nombre}
                apellido={user.apellido}
                email={user.email}
                avatarUrl={user.avatarUrl}
                size="lg"
              />
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white animate-spin">progress_activity</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-lg font-semibold text-[#091426] dark:text-white">{displayName}</p>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 text-sm font-medium bg-[#4edea3] text-[#091426] rounded-lg hover:bg-[#3cc78e] disabled:opacity-50 transition-colors"
              >
                {user.avatarUrl ? 'Cambiar foto' : 'Subir foto'}
              </button>
              {user.avatarUrl && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>
            <p className="text-xs text-[#45474c] dark:text-[#c5c6cd]">
              JPG, PNG o WebP. Maximo 2MB.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* User info */}
        <div className="border-t border-[#e2e8f0] dark:border-white/10 pt-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-[#45474c] dark:text-[#c5c6cd] uppercase tracking-wider">
              Email
            </label>
            <p className="text-sm text-[#091426] dark:text-white mt-1">{user.email}</p>
          </div>
          {user.nombre && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#45474c] dark:text-[#c5c6cd] uppercase tracking-wider">
                  Nombre
                </label>
                <p className="text-sm text-[#091426] dark:text-white mt-1">{user.nombre}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[#45474c] dark:text-[#c5c6cd] uppercase tracking-wider">
                  Apellido
                </label>
                <p className="text-sm text-[#091426] dark:text-white mt-1">{user.apellido}</p>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-[#45474c] dark:text-[#c5c6cd] uppercase tracking-wider">
              Rol
            </label>
            <p className="text-sm text-[#091426] dark:text-white mt-1">{user.rol}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
