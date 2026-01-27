'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from '@/lib/clsx';
import { api } from '@/lib/api/api';
import { FiEye, FiEyeOff, FiLogIn, FiAlertTriangle } from 'react-icons/fi';

type MeResponse = {
	ok: boolean;
	tenant_id: number;
	admin_user_id: number;
	email: string;
	role: string;
};

type LoginResponse = {
	ok: boolean;
	tenant_id: number;
	admin_user_id: number;
	email: string;
	role: string;
};

export default function AdminLoginPage() {
	const router = useRouter();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPw, setShowPw] = useState(false);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const canSubmit = useMemo(() => {
		return email.trim() && password.trim() && !loading;
	}, [email, password, loading]);

	// If already logged in, go to /admin
	useEffect(() => {
		(async () => {
			try {
				const me = await api<MeResponse>('/admin/auth/me', { method: 'GET' });
				if (me?.ok) router.replace('/admin');
			} catch {
				// ignore
			}
		})();
	}, [router]);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			await api<LoginResponse>('/admin/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: email.trim(),
					password,
				}),
			});

			router.replace('/admin');
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			setError('Invalid email or password');
		} finally {
			setLoading(false);
		}
	}

	return (
		<main className='min-h-screen bg-slate-50 px-4 py-10 flex justify-center items-center'>
			<div className='mx-auto w-full max-w-[520px]'>
				<div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
					<div className='border-b border-slate-200 px-6 py-5'>
						<div className='text-xl font-extrabold tracking-tight text-slate-900'>
							Admin Login
						</div>
					</div>

					<div className='p-6'>
						{error ? (
							<div className='mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700'>
								<div className='flex items-start gap-2'>
									<FiAlertTriangle className='mt-0.5 shrink-0' />
									<div className='min-w-0'>{error}</div>
								</div>
							</div>
						) : null}

						<form onSubmit={onSubmit} className='space-y-4'>
							<div>
								<div className='text-[11px] font-extrabold tracking-wider text-slate-500'>
									EMAIL
								</div>
								<div className='mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100'>
									<input
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className='w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400'
										placeholder='admin@domain.com'
										autoComplete='email'
										inputMode='email'
									/>
								</div>
							</div>

							<div>
								<div className='text-[11px] font-extrabold tracking-wider text-slate-500'>
									PASSWORD
								</div>
								<div className='mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100'>
									<input
										type={showPw ? 'text' : 'password'}
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className='w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400'
										placeholder='••••••••••••••••'
										autoComplete='current-password'
									/>
									<button
										type='button'
										onClick={() => setShowPw((p) => !p)}
										className='rounded-xl p-2 text-slate-500 hover:bg-slate-50'
										aria-label={showPw ? 'Hide password' : 'Show password'}
									>
										{showPw ? <FiEyeOff /> : <FiEye />}
									</button>
								</div>
							</div>

							<button
								type='submit'
								disabled={!canSubmit}
								className={clsx(
									'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold text-white shadow-sm transition',
									canSubmit
										? 'bg-primary hover:bg-blue-700'
										: 'cursor-not-allowed bg-slate-300',
								)}
							>
								<FiLogIn />
								{loading ? 'Signing in...' : 'Sign in'}
							</button>

							<div className='pt-2 text-center text-xs font-semibold text-slate-500'>
								<Link href='/' className='hover:text-slate-700'>
									Go back to site
								</Link>
							</div>
						</form>
					</div>
				</div>
			</div>
		</main>
	);
}
