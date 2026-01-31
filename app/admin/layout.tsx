import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminShell from './AdminShell';

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const h = await headers(); // ✅ await
	const host = h.get('host') ?? '';

	const base = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
	if (!base) throw new Error('Missing BACKEND_URL / NEXT_PUBLIC_BACKEND_URL');

	const cookieHeader = (await cookies()).toString(); // ✅ some builds also require await
	if (!cookieHeader) redirect('/login');

	const res = await fetch(`${base}/admin/auth/me`, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
			Cookie: cookieHeader,
			...(host ? { 'x-forwarded-host': host } : {}),
		},
		cache: 'no-store',
	});

	if (!res.ok) redirect('/login');

	return <AdminShell>{children}</AdminShell>;
}
