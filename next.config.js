/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google Auth profile pictures
  },
  // Add any other Next.js config options you need
}

module.exports = nextConfig 