import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let mockUser: any = {
  id: 'user-1',
  email: 'juan@example.com',
  rol: 'CONTADOR',
  nombre: 'Juan',
  apellido: 'Pérez',
  avatarUrl: null,
};
const mockUpdateUserProfile = vi.fn();

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    updateUserProfile: mockUpdateUserProfile,
  }),
}));

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';
import PerfilPage from './page';

describe('PerfilPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      id: 'user-1',
      email: 'juan@example.com',
      rol: 'CONTADOR',
      nombre: 'Juan',
      apellido: 'Pérez',
      avatarUrl: null,
    };
  });

  it('renders user profile info', () => {
    render(<PerfilPage />);

    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('juan@example.com')).toBeInTheDocument();
    expect(screen.getByText('CONTADOR')).toBeInTheDocument();
  });

  it('shows "Subir foto" when no avatar', () => {
    render(<PerfilPage />);
    expect(screen.getByText('Subir foto')).toBeInTheDocument();
  });

  it('shows "Cambiar foto" and "Eliminar" when avatar exists', () => {
    mockUser.avatarUrl = 'https://example.com/avatar.jpg';
    render(<PerfilPage />);
    expect(screen.getByText('Cambiar foto')).toBeInTheDocument();
    expect(screen.getByText('Eliminar')).toBeInTheDocument();
  });

  it('shows file type and size hint', () => {
    render(<PerfilPage />);
    expect(screen.getByText(/JPG, PNG o WebP/)).toBeInTheDocument();
    expect(screen.getByText(/Maximo 2MB/)).toBeInTheDocument();
  });

  it('shows error for invalid file type', async () => {
    render(<PerfilPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' });

    fireEvent.change(input, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Tipo de archivo no permitido/)).toBeInTheDocument();
    });
  });

  it('shows error for file over 2MB', async () => {
    render(<PerfilPage />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(screen.getByText(/tamaño máximo de 2MB/)).toBeInTheDocument();
    });
  });

  it('calls delete endpoint and updates profile on remove', async () => {
    mockUser.avatarUrl = 'https://example.com/avatar.jpg';
    (apiFetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { avatarUrl: null } }),
    });

    render(<PerfilPage />);
    fireEvent.click(screen.getByText('Eliminar'));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/v1/usuarios/me/avatar', { method: 'DELETE' });
      expect(mockUpdateUserProfile).toHaveBeenCalledWith({ avatarUrl: null });
    });
  });

  it('returns null when no user', () => {
    mockUser = null;
    const { container } = render(<PerfilPage />);
    expect(container.innerHTML).toBe('');
  });
});
