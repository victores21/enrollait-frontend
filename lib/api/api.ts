type ApiOptions = RequestInit & {
	// Only used on the server (Next.js caching)
	next?: { revalidate?: number; tags?: string[] };
};

// Detect server vs browser and pick the right env
function getBaseUrl() {
	const isServer = typeof window === 'undefined';
	const base = isServer
		? process.env.BACKEND_URL
		: process.env.NEXT_PUBLIC_BACKEND_URL;
	if (!base) throw new Error('Missing BACKEND_URL / NEXT_PUBLIC_BACKEND_URL');
	return base;
}

export async function api<T>(
	path: string,
	options: ApiOptions = {}
): Promise<T> {
	const base = getBaseUrl();
	const url = `${base}${path}`;

	const res = await fetch(url, {
		...options,
		headers: {
			Accept: 'application/json',
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

// Helper to build query strings quickly
export function qs(
	params: Record<string, string | number | boolean | null | undefined>
) {
	const sp = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined || v === null || v === '') continue;
		sp.set(k, String(v));
	}
	const s = sp.toString();
	return s ? `?${s}` : '';
}

// Server Side

// import { api, qs } from "@/lib/api";

// type ProductsPaged = {
//   items: any[];
//   total: number;
//   page: number;
//   page_size: number;
// };

// export default async function Home() {
//   const tenantId = 1;

//   const data = await api<ProductsPaged>(
//     `/tenants/${tenantId}/products/paged` +
//       qs({
//         page: 1,
//         page_size: 12,
//         published_only: true,
//         include_categories: true,
//       }),
//     { next: { revalidate: 60 } } // server caching
//   );

//   return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
// }

// Client Side
// "use client";

// import { useEffect, useState } from "react";
// import { api, qs } from "@/lib/api";

// export default function SearchCourses() {
//   const [q, setQ] = useState("");
//   const [items, setItems] = useState<any[]>([]);

//   useEffect(() => {
//     api<{ items: any[] }>(
//       `/tenants/1/products/paged` +
//         qs({ page: 1, page_size: 12, published_only: true, include_categories: true, search: q })
//     ).then((res) => setItems(res.items));
//   }, [q]);

//   return (
//     <div>
//       <input
//         className="border rounded-xl px-4 py-2 w-full"
//         value={q}
//         onChange={(e) => setQ(e.target.value)}
//         placeholder="Search…"
//       />
//       <div className="mt-4 grid grid-cols-2 gap-3">
//         {items.map((x, i) => (
//           <div key={i} className="border rounded-xl p-3 bg-white">
//             {x.title ?? x.slug ?? "Course"}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
