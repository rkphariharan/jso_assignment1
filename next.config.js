/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist', 'mammoth'],
  },
};

module.exports = nextConfig;
