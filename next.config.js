/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // GitHub Pages のリポジトリ名に合わせて basePath を設定
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  trailingSlash: true,
};

module.exports = nextConfig;
