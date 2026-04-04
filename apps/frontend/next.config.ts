import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@numerito/shared'],
  reactCompiler: true,
};

export default nextConfig;
