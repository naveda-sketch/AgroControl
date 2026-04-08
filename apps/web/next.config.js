/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@agrocontrol/shared', '@agrocontrol/db', '@agrocontrol/business-logic', '@agrocontrol/ui'],
};

module.exports = nextConfig;
