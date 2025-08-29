/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'avatars.steamstatic.com',
      'steamcdn-a.akamaihd.net',
      'steamuserimages-a.akamaihd.net',
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

module.exports = nextConfig
