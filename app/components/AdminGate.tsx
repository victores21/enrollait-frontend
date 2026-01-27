'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/api';

type MeResponse = {
	ok: boolean;
	tenant_id: number;
	admin_user_id: number;
	email: string;
	role: string;
};

export default function AdminGate({
	children,
	redirectTo = '/admin/login',
}: {
	children: React.ReactNode;
	redirectTo?: string;
}) {
	const router = useRouter();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const me = await api<MeResponse>('/admin/auth/me', { method: 'GET' });
				if (!me?.ok) router.replace(redirectTo);
			} catch {
				router.replace(redirectTo);
			} finally {
				setLoading(false);
			}
		})();
	}, [router, redirectTo]);

	if (loading) {
		return (
			<div className='mx-auto max-w-[1200px] px-4 py-10 text-sm font-semibold text-slate-500'>
				Loading...
			</div>
		);
	}

	return <>{children}</>;
}
