import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ── Deployment-Variante wählen: ──
  // 'export'     → Statisch (GitHub Pages, kein Server nötig)
  // 'standalone' → Server-Build (Docker, Node.js Backend)
  output: 'standalone',

  images: { unoptimized: true },

  // pdfmake uses Node.js fs/path internally — must not be bundled by webpack/turbopack
  serverExternalPackages: ['pdfmake'],
};

export default nextConfig;
