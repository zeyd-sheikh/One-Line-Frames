const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const remotePatterns = supabaseUrl
  ? [
      {
        protocol: "https",
        hostname: new URL(supabaseUrl).hostname,
        pathname: "/storage/v1/object/**",
      },
    ]
  : [];

const nextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
