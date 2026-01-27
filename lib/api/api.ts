// type ApiOptions = RequestInit & {
// 	// Only used on the server (Next.js caching)
// 	next?: { revalidate?: number; tags?: string[] };
// };

// // Detect server vs browser and pick the right env
// function getBaseUrl() {
// 	const isServer = typeof window === 'undefined';
// 	const base = isServer
// 		? process.env.BACKEND_URL
// 		: process.env.NEXT_PUBLIC_BACKEND_URL;
// 	if (!base) throw new Error('Missing BACKEND_URL / NEXT_PUBLIC_BACKEND_URL');
// 	return base;
// }

// export async function api<T>(
// 	path: string,
// 	options: ApiOptions = {}
// ): Promise<T> {
// 	const base = getBaseUrl();
// 	const url = `${base}${path}`;

// 	const res = await fetch(url, {
// 		...options,
// 		headers: {
// 			Accept: 'application/json',
// 			...(options.headers || {}),
// 		},
// 	});

// 	if (!res.ok) {
// 		let msg = `Request failed (${res.status})`;
// 		try {
// 			const err = await res.json();
// 			msg = err?.detail ? String(err.detail) : msg;
// 		} catch {}
// 		throw new Error(msg);
// 	}

// 	return (await res.json()) as T;
// }

// // Helper to build query strings quickly
// export function qs(
// 	params: Record<string, string | number | boolean | null | undefined>
// ) {
// 	const sp = new URLSearchParams();
// 	for (const [k, v] of Object.entries(params)) {
// 		if (v === undefined || v === null || v === '') continue;
// 		sp.set(k, String(v));
// 	}
// 	const s = sp.toString();
// 	return s ? `?${s}` : '';
// }

// lib/api/api.ts

type ApiOptions = RequestInit & {
	next?: { revalidate?: number; tags?: string[] };
};

function getBaseUrl() {
	const isServer = typeof window === 'undefined';
	const base = isServer
		? process.env.BACKEND_URL
		: process.env.NEXT_PUBLIC_BACKEND_URL;
	if (!base) throw new Error('Missing BACKEND_URL / NEXT_PUBLIC_BACKEND_URL');
	return base;
}

function getTenantHostFromBrowser() {
	if (typeof window === 'undefined') return null;
	return window.location.host; // includes subdomain + optional port
}

// ✅ Browser-safe API helper (for ALL client components)
export async function api<T>(
	path: string,
	options: ApiOptions = {},
): Promise<T> {
	const base = getBaseUrl();
	const url = `${base}${path}`;

	const tenantHost = getTenantHostFromBrowser();

	const res = await fetch(url, {
		...options,
		credentials: 'include', // ✅ important for cookies
		headers: {
			Accept: 'application/json',
			...(tenantHost ? { 'x-forwarded-host': tenantHost } : {}),
			...(options.headers || {}),
		},
	});

	if (!res.ok) {
		let msg = `Request failed (${res.status})`;
		try {
			const err = await res.json();
			msg = err?.detail ? String(err.detail) : msg;
		} catch {}
		throw new Error(msg);
	}

	return (await res.json()) as T;
}

export function qs(
	params: Record<string, string | number | boolean | null | undefined>,
) {
	const sp = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined || v === null || v === '') continue;
		sp.set(k, String(v));
	}
	const s = sp.toString();
	return s ? `?${s}` : '';
}
