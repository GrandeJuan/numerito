'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CallbackContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      setTimeout(() => {
        window.location.href = `/login?error=${encodeURIComponent(errorParam)}`;
      }, 2000);
      return;
    }

    if (accessToken && refreshToken) {
      document.cookie = `access_token=${accessToken}; path=/; max-age=900`;
      document.cookie = `refresh_token=${refreshToken}; path=/; max-age=604800`;

      // Decode token to get role for redirect
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const rol = payload.rol;
        if (rol === 'SUPERADMIN') {
          window.location.href = '/admin';
        } else if (rol === 'CLIENTE') {
          window.location.href = '/portal';
        } else {
          window.location.href = '/dashboard';
        }
      } catch {
        window.location.href = '/dashboard';
      }
    } else {
      setError('No se recibieron credenciales');
      setTimeout(() => {
        window.location.href = '/login?error=sso_failed';
      }, 2000);
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8ff]">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8ff]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#091426] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-600 mt-4">Completando autenticación...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
