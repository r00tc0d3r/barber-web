import type { NextConfig } from "next";

const securityHeaders = [
	{
		key: "X-Content-Type-Options",
		value: "nosniff",
	},
	{
		key: "X-Frame-Options",
		value: "DENY",
	},
	{
		key: "X-XSS-Protection",
		value: "1; mode=block",
	},
	{
		key: "Referrer-Policy",
		value: "strict-origin-when-cross-origin",
	},
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=()",
	},
	{
		key: "Content-Security-Policy",
		value: [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' https://images.unsplash.com data: blob:",
			"font-src 'self'",
			"connect-src 'self'",
			"frame-ancestors 'none'",
		].join("; "),
	},
];

// HSTS only in production
if (process.env.NODE_ENV === "production") {
	securityHeaders.push({
		key: "Strict-Transport-Security",
		value: "max-age=63072000; includeSubDomains; preload",
	});
}

const nextConfig: NextConfig = {
	turbopack: {
		root: process.cwd(),
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
		],
	},
	headers: async () => [
		{
			source: "/((?!api|_next/static|_next/image|favicon.ico|sw.js|icons).*)",
			headers: securityHeaders,
		},
	],
};

export default nextConfig;
