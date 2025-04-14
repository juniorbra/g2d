/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para output standalone (necessário para Docker)
  output: 'standalone',
  
  // Outras configurações
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
