import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAvatar } from './user-avatar';

describe('UserAvatar', () => {
  describe('initials fallback', () => {
    it('shows initials from nombre and apellido', () => {
      render(<UserAvatar nombre="Juan" apellido="Pérez" email="juan@example.com" />);
      expect(screen.getByText('JP')).toBeInTheDocument();
    });

    it('shows initials from email when no nombre/apellido', () => {
      render(<UserAvatar email="maria.garcia@example.com" />);
      expect(screen.getByText('MG')).toBeInTheDocument();
    });

    it('shows ? when no data provided', () => {
      render(<UserAvatar />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('renders green circle with correct classes', () => {
      const { container } = render(<UserAvatar nombre="Ana" apellido="López" />);
      const div = container.firstChild as HTMLElement;
      expect(div.className).toContain('bg-[#4edea3]');
      expect(div.className).toContain('rounded-full');
    });
  });

  describe('photo mode', () => {
    it('renders img when avatarUrl is provided', () => {
      render(
        <UserAvatar
          nombre="Juan"
          apellido="Pérez"
          avatarUrl="https://example.com/avatar.jpg"
        />,
      );
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      expect(img).toHaveAttribute('alt', 'Juan Pérez');
    });

    it('renders initials when avatarUrl is null', () => {
      render(<UserAvatar nombre="Juan" apellido="Pérez" avatarUrl={null} />);
      expect(screen.getByText('JP')).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('applies sm size by default', () => {
      const { container } = render(<UserAvatar nombre="A" apellido="B" />);
      const div = container.firstChild as HTMLElement;
      expect(div.className).toContain('w-8');
      expect(div.className).toContain('h-8');
    });

    it('applies md size', () => {
      const { container } = render(<UserAvatar nombre="A" apellido="B" size="md" />);
      const div = container.firstChild as HTMLElement;
      expect(div.className).toContain('w-10');
      expect(div.className).toContain('h-10');
    });

    it('applies lg size', () => {
      const { container } = render(<UserAvatar nombre="A" apellido="B" size="lg" />);
      const div = container.firstChild as HTMLElement;
      expect(div.className).toContain('w-16');
      expect(div.className).toContain('h-16');
    });

    it('applies size to img when avatarUrl provided', () => {
      render(
        <UserAvatar
          nombre="A"
          apellido="B"
          avatarUrl="https://example.com/avatar.jpg"
          size="lg"
        />,
      );
      const img = screen.getByRole('img');
      expect(img.className).toContain('w-16');
      expect(img.className).toContain('h-16');
    });
  });
});
