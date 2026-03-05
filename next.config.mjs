/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nedrug.mfds.go.kr',
      },
      {
        protocol: 'http',
        hostname: 'nedrug.mfds.go.kr',
      },
    ],
  },
};

export default nextConfig;
