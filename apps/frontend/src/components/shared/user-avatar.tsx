'use client';

interface UserAvatarProps {
  nombre?: string;
  apellido?: string;
  email?: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl',
};

function getInitials(nombre?: string, apellido?: string, email?: string): string {
  if (nombre && apellido) {
    return `${nombre[0]}${apellido[0]}`.toUpperCase();
  }
  if (email) {
    return email
      .split('@')[0]
      .split(/[._-]/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? '')
      .join('');
  }
  return '?';
}

export function UserAvatar({ nombre, apellido, email, avatarUrl, size = 'sm' }: UserAvatarProps) {
  const sizeClass = SIZE_CLASSES[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={nombre ? `${nombre} ${apellido ?? ''}`.trim() : 'Avatar'}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }

  const initials = getInitials(nombre, apellido, email);

  return (
    <div
      className={`${sizeClass} rounded-full bg-[#4edea3] flex items-center justify-center text-[#091426] font-bold select-none`}
    >
      {initials}
    </div>
  );
}
