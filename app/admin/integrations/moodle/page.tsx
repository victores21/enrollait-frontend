'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import CardShell from '@/app/components/CardShell';
import { Pill } from '@/app/components/Pill';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import {
	FiCheckCircle,
	FiClock,
	FiXCircle,
	FiEye,
	FiEyeOff,
	FiRefreshCw,
	FiArrowRight,
	FiDownloadCloud,
	FiExternalLink,
	FiLink,
} from 'react-icons/fi';

import { api } from '@/lib/api/api';
import clsx from '@/lib/clsx';

type ConnState = 'idle' | 'testing' | 'ok' | 'error';
type SyncState = 'idle' | 'syncing';
type SaveState = 'idle' | 'saving';

type MoodleTestResponse = {
	connected: boolean;
	message: string;
};

type MoodleConnectResponse = {
	connected: boolean;
	message: string;
	tenant_id?: number;
	domain?: string;
};

type MoodleSyncResponse = {
	ok: boolean;
	tenant_id: number;
	fetched_from_moodle: number;
	upserted: number;
	message: string;
};

type MoodleSnapshot = {
	ok: boolean;
	tenant: {
		tenant_id: number;
		domain?: string | null;
		name?: string | null;
		moodle_configured: boolean;
		moodle_url?: string | null;
	};
	summary: {
		categories_total: number;
		courses_total: number;
	};
};

function Banner({
	variant,
	title,
	body,
	onClose,
}: {
	variant: 'success' | 'error' | 'info';
	title: string;
	body?: string;
	onClose?: () => void;
}) {
	return (
		<div
			className={clsx(
				'rounded-2xl border px-4 py-3',
				variant === 'success' && 'border-emerald-200 bg-emerald-50',
				variant === 'error' && 'border-rose-200 bg-rose-50',
				variant === 'info' && 'border-slate-200 bg-slate-50',
			)}
		>
			<div className='flex items-center justify-between gap-3'>
				<div className='min-w-0'>
					<div
						className={clsx(
							'text-sm font-extrabold',
							variant === 'success' && 'text-emerald-700',
							variant === 'error' && 'text-rose-700',
							variant === 'info' && 'text-slate-700',
						)}
					>
						{title}
					</div>
					{body ? (
						<div className='mt-0.5 whitespace-pre-wrap text-xs font-semibold text-slate-600'>
							{body}
						</div>
					) : null}
				</div>

				{onClose ? (
					<button
						onClick={onClose}
						className='rounded-lg p-1 text-slate-400 hover:bg-white/60 hover:text-slate-600'
						aria-label='Close'
						type='button'
					>
						✕
					</button>
				) : null}
			</div>
		</div>
	);
}

/** Extract only hostname (no protocol/path/port). */
function getHostnameOnly(input: string): string {
	const raw = (input || '').trim();
	if (!raw) return '';
	try {
		const url = raw.startsWith('http')
			? new URL(raw)
			: new URL(`https://${raw}`);
		return url.hostname.replace(/^www\./, '').toLowerCase();
	} catch {
		return raw
			.replace(/^https?:\/\//, '')
			.replace(/\/.*$/, '')
			.replace(/:\d+$/, '')
			.replace(/^www\./, '')
			.toLowerCase();
	}
}

function nameFromDomain(domain: string): string {
	const d = getHostnameOnly(domain);
	if (!d) return '';
	const base = d.split('.')[0] || d;
	return base
		.replace(/[-_]+/g, ' ')
		.split(' ')
		.filter(Boolean)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' ');
}

function tokenStorageKey(tenantId: number | null, domain: string) {
	if (tenantId) return `moodle_token_tenant_${tenantId}`;
	const d = getHostnameOnly(domain);
	return d ? `moodle_token_domain_${d}` : 'moodle_token_domain_unknown';
}

export default function AdminMoodleIntegrationPage() {
	// fields
	const [moodleUrl, setMoodleUrl] = useState('');
	const [token, setToken] = useState('');
	const [showToken, setShowToken] = useState(false);

	// domain/name from current site
	const [domain, setDomain] = useState('');
	const [name, setName] = useState('');
	const [domainWarning, setDomainWarning] = useState<string | null>(null);

	// server state
	const [snapshot, setSnapshot] = useState<MoodleSnapshot | null>(null);
	const [snapshotLoading, setSnapshotLoading] = useState(true);
	const [tenantId, setTenantId] = useState<number | null>(null);

	// ui state
	const [banner, setBanner] = useState<{
		variant: 'success' | 'error' | 'info';
		title: string;
		body?: string;
	} | null>(null);

	const [connState, setConnState] = useState<ConnState>('idle');
	const [hasTestedOk, setHasTestedOk] = useState(false);

	const [syncState, setSyncState] = useState<SyncState>('idle');
	const [saveState, setSaveState] = useState<SaveState>('idle');

	// --- domain + name
	useEffect(() => {
		const host =
			typeof window !== 'undefined'
				? window.location.hostname.replace(/^www\./, '').toLowerCase()
				: '';

		if (!host || host === 'localhost' || host === '127.0.0.1') {
			setDomain('');
			setName('');
			setDomainWarning(
				'You are running on localhost, so the tenant domain cannot be auto-detected. Deploy (or open the app on your real domain) to auto-fill domain & name.',
			);
			return;
		}

		setDomain(host);
		setName(nameFromDomain(host));
		setDomainWarning(null);
	}, []);

	// --- snapshot
	const refreshSnapshot = useCallback(async () => {
		setSnapshotLoading(true);
		try {
			const snap = await api<MoodleSnapshot>('/integrations/moodle/snapshot', {
				method: 'GET',
				cache: 'no-store',
			});
			setSnapshot(snap);

			const tid = snap?.tenant?.tenant_id ?? null;
			setTenantId(tid);

			const configured = !!snap?.tenant?.moodle_configured;

			// prefill moodle url from DB if user hasn't typed
			const urlFromDb = (snap?.tenant?.moodle_url || '').toString();
			if (urlFromDb && !moodleUrl.trim()) setMoodleUrl(urlFromDb);

			// If already configured, allow save-less flow (user can still test)
			if (configured) setHasTestedOk(true);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			console.error(e);
		} finally {
			setSnapshotLoading(false);
		}
	}, [moodleUrl]);

	useEffect(() => {
		refreshSnapshot();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// --- token persistence (local only)
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const key = tokenStorageKey(tenantId, domain);
		const saved = window.localStorage.getItem(key);
		if (saved && !token) setToken(saved);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tenantId, domain]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const key = tokenStorageKey(tenantId, domain);
		if (token) window.localStorage.setItem(key, token);
		else window.localStorage.removeItem(key);
	}, [token, tenantId, domain]);

	const configured = !!snapshot?.tenant?.moodle_configured;

	// Flow:
	// 1) Fill URL+token -> Test
	// 2) If test ok -> Save
	// 3) If configured -> Sync
	const canTest = moodleUrl.trim() && token.trim() && connState !== 'testing';
	const canSave =
		!configured &&
		hasTestedOk &&
		moodleUrl.trim() &&
		token.trim() &&
		domain.trim() &&
		name.trim();

	const canSync = configured && syncState !== 'syncing';

	const step = useMemo(() => {
		if (!configured) return 1;
		return 2;
	}, [configured]);

	async function testConnection() {
		setConnState('testing');
		setHasTestedOk(false);
		setBanner(null);

		try {
			const res = await api<MoodleTestResponse>('/integrations/moodle/test', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					moodle_url: moodleUrl.trim(),
					token: token.trim(),
				}),
				cache: 'no-store',
			});

			if (res.connected) {
				setConnState('ok');
				setHasTestedOk(true);
				setBanner({ variant: 'success', title: 'Connection OK' });
			} else {
				setConnState('error');
				setHasTestedOk(false);
				setBanner({
					variant: 'error',
					title: 'Connection failed',
					body: res.message,
				});
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			setConnState('error');
			setHasTestedOk(false);
			setBanner({
				variant: 'error',
				title: 'Connection failed',
				body: e?.message ?? 'Could not connect. Check URL/token and try again.',
			});
		}
	}

	async function saveConnection() {
		setBanner(null);
		setSaveState('saving');

		try {
			const res = await api<MoodleConnectResponse>(
				'/integrations/moodle/connect',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						domain,
						name,
						moodle_url: moodleUrl.trim(),
						token: token.trim(),
					}),
					cache: 'no-store',
				},
			);

			if (res.connected) {
				setBanner({
					variant: 'success',
					title: 'Connection saved',
					body: 'You can now sync courses and categories.',
				});
				await refreshSnapshot();
			} else {
				setBanner({
					variant: 'error',
					title: 'Save failed',
					body: res.message,
				});
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			setBanner({
				variant: 'error',
				title: 'Save failed',
				body: e?.message ?? 'Failed to save connection.',
			});
		} finally {
			setSaveState('idle');
		}
	}

	async function syncCourses() {
		setSyncState('syncing');
		setBanner(null);

		try {
			const res = await api<MoodleSyncResponse>(
				'/integrations/moodle/sync-courses',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({}),
					cache: 'no-store',
				},
			);

			if (res.ok) {
				setBanner({ variant: 'success', title: 'Courses synced' });
				await refreshSnapshot();
			} else {
				setBanner({
					variant: 'error',
					title: 'Sync failed',
					body: res.message,
				});
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			setBanner({
				variant: 'error',
				title: 'Sync failed',
				body: e?.message ?? 'Failed to sync courses.',
			});
		} finally {
			setTimeout(() => setSyncState('idle'), 600);
		}
	}

	async function syncCategories() {
		setSyncState('syncing');
		setBanner(null);

		try {
			const res = await api<MoodleSyncResponse>(
				'/integrations/moodle/sync-categories',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({}),
					cache: 'no-store',
				},
			);

			if (res.ok) {
				setBanner({ variant: 'success', title: 'Categories synced' });
				await refreshSnapshot();
			} else {
				setBanner({
					variant: 'error',
					title: 'Sync failed',
					body: res.message,
				});
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			setBanner({
				variant: 'error',
				title: 'Sync failed',
				body: e?.message ?? 'Failed to sync categories.',
			});
		} finally {
			setTimeout(() => setSyncState('idle'), 600);
		}
	}

	return (
		<>
			<LoadingOverlay
				show={
					snapshotLoading ||
					connState === 'testing' ||
					saveState === 'saving' ||
					syncState === 'syncing'
				}
				title={
					connState === 'testing'
						? 'Testing Moodle connection…'
						: saveState === 'saving'
							? 'Saving Moodle connection…'
							: syncState === 'syncing'
								? 'Syncing from Moodle…'
								: 'Loading…'
				}
				message={
					connState === 'testing'
						? 'Validating your Moodle URL and token.'
						: saveState === 'saving'
							? 'Persisting Moodle URL/token for this tenant.'
							: syncState === 'syncing'
								? 'Fetching courses/categories and updating your database.'
								: 'Fetching current Moodle configuration.'
				}
			/>

			<main className='mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8'>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
					<div>
						<h1 className='text-2xl font-extrabold tracking-tight'>
							Moodle Integration
						</h1>
						<p className='mt-1 text-sm font-medium text-slate-500'>
							1) Test connection → 2) Save → 3) Sync courses & categories
						</p>
					</div>

					<Link
						href='/admin/integrations'
						className='inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50'
					>
						Back to integrations
					</Link>
				</div>

				<div className='mt-6 flex flex-wrap gap-6'>
					{/* LEFT */}
					<div className='space-y-6 flex-1'>
						<CardShell title='Setup' subtitle='Connect Moodle and sync data.'>
							{/* top status */}
							<div className='flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3'>
								<div className='min-w-0'>
									<div className='text-[11px] font-extrabold tracking-wider text-slate-500'>
										STATUS
									</div>
									<div className='mt-1 text-sm font-extrabold text-slate-900'>
										{configured ? 'Configured' : 'Not configured'}
									</div>
								</div>

								<div className='flex items-center gap-2'>
									{configured ? (
										<Pill variant='green'>
											<FiCheckCircle className='h-3.5 w-3.5' />
											Saved
										</Pill>
									) : (
										<Pill variant='slate'>
											<FiClock className='h-3.5 w-3.5' />
											Setup
										</Pill>
									)}

									<button
										onClick={refreshSnapshot}
										className='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 shadow-sm hover:bg-slate-50'
										type='button'
									>
										<FiRefreshCw
											className={clsx(snapshotLoading && 'animate-spin')}
										/>
										Refresh
									</button>
								</div>
							</div>

							{/* banner */}
							<div className='mt-4 space-y-3'>
								{banner ? (
									<Banner
										variant={banner.variant}
										title={banner.title}
										body={banner.body}
										onClose={() => setBanner(null)}
									/>
								) : null}

								{domainWarning ? (
									<Banner
										variant='info'
										title='Domain not detected'
										body={domainWarning}
									/>
								) : null}
							</div>

							{/* Snapshot summary */}
							{configured ? (
								<div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
									<div className='rounded-2xl border border-slate-200 bg-white px-4 py-3'>
										<div className='text-[11px] font-extrabold tracking-wider text-slate-500'>
											COURSES
										</div>
										<div className='mt-1 text-lg font-extrabold text-slate-900'>
											{snapshot?.summary?.courses_total ?? 0}
										</div>
									</div>
									<div className='rounded-2xl border border-slate-200 bg-white px-4 py-3'>
										<div className='text-[11px] font-extrabold tracking-wider text-slate-500'>
											CATEGORIES
										</div>
										<div className='mt-1 text-lg font-extrabold text-slate-900'>
											{snapshot?.summary?.categories_total ?? 0}
										</div>
									</div>
								</div>
							) : null}

							{/* Step 1: Credentials */}
							<div className='mt-6'>
								<div className='flex items-center gap-2'>
									<span
										className={clsx(
											'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold',
											step === 1
												? 'border-blue-200 bg-blue-50 text-blue-700'
												: 'border-slate-200 bg-slate-50 text-slate-600',
										)}
									>
										1. Credentials
									</span>

									{connState === 'ok' ? (
										<Pill variant='green'>
											<FiCheckCircle className='h-3.5 w-3.5' />
											Test OK
										</Pill>
									) : connState === 'error' ? (
										<Pill variant='rose'>
											<FiXCircle className='h-3.5 w-3.5' />
											Test failed
										</Pill>
									) : null}
								</div>

								<div className='mt-4'>
									<div className='text-[11px] font-extrabold tracking-wider text-slate-500'>
										MOODLE URL
									</div>
									<div className='mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
										<input
											value={moodleUrl}
											onChange={(e) => setMoodleUrl(e.target.value)}
											className='w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400'
											placeholder='https://your-moodle-site.com'
										/>
									</div>

									<div className='mt-6 flex items-center justify-between'>
										<div className='text-[11px] font-extrabold tracking-wider text-slate-500'>
											ACCESS TOKEN
										</div>
										<Link
											href='/admin/integrations/moodle/docs'
											className='inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700'
										>
											How to generate?
											<FiExternalLink className='h-3.5 w-3.5' />
										</Link>
									</div>

									<div className='mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
										<input
											type={showToken ? 'text' : 'password'}
											value={token}
											onChange={(e) => setToken(e.target.value)}
											className='w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400'
											placeholder='••••••••••••••••'
										/>
										<button
											onClick={() => setShowToken((p) => !p)}
											className='rounded-xl p-2 text-slate-500 hover:bg-slate-50'
											aria-label={showToken ? 'Hide token' : 'Show token'}
											type='button'
										>
											{showToken ? <FiEyeOff /> : <FiEye />}
										</button>
									</div>

									<div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center'>
										<button
											onClick={testConnection}
											disabled={!canTest}
											className={clsx(
												'inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-extrabold shadow-sm sm:w-auto',
												canTest
													? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
													: 'cursor-not-allowed border-slate-200 bg-white text-slate-400',
											)}
											type='button'
										>
											<FiRefreshCw
												className={clsx(
													connState === 'testing' && 'animate-spin',
												)}
											/>
											{connState === 'testing'
												? 'Testing...'
												: 'Test connection'}
										</button>

										{configured ? (
											<Pill variant='green'>
												<FiCheckCircle className='h-3.5 w-3.5' />
												Already saved
											</Pill>
										) : (
											<button
												onClick={saveConnection}
												disabled={!canSave}
												className={clsx(
													'inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold text-white shadow-sm sm:ml-auto sm:w-auto',
													canSave
														? 'bg-primary hover:bg-blue-700'
														: 'cursor-not-allowed bg-slate-300',
												)}
												type='button'
											>
												Save connection
												<FiArrowRight />
											</button>
										)}
									</div>
								</div>
							</div>

							{/* Step 2: Sync */}
							<div className='mt-10 border-t border-slate-200 pt-6'>
								<div className='flex items-center justify-between gap-3'>
									<span
										className={clsx(
											'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold',
											configured
												? 'border-blue-200 bg-blue-50 text-blue-700'
												: 'border-slate-200 bg-slate-50 text-slate-600',
										)}
									>
										2. Sync
									</span>

									{configured ? (
										<Pill variant='green'>
											<FiCheckCircle className='h-3.5 w-3.5' />
											Ready to sync
										</Pill>
									) : (
										<Pill variant='slate'>
											<FiClock className='h-3.5 w-3.5' />
											Save connection first
										</Pill>
									)}
								</div>

								<div className='mt-4 mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
									<button
										onClick={syncCourses}
										disabled={!canSync}
										className={clsx(
											'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold shadow-sm',
											canSync
												? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
												: 'cursor-not-allowed border-slate-200 bg-white text-slate-400',
										)}
										type='button'
									>
										<FiDownloadCloud
											className={clsx(
												syncState === 'syncing' && 'animate-pulse',
											)}
										/>
										Sync courses
									</button>

									<button
										onClick={syncCategories}
										disabled={!canSync}
										className={clsx(
											'inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold shadow-sm',
											canSync
												? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
												: 'cursor-not-allowed border-slate-200 bg-white text-slate-400',
										)}
										type='button'
									>
										<FiDownloadCloud
											className={clsx(
												syncState === 'syncing' && 'animate-pulse',
											)}
										/>
										Sync categories
									</button>
								</div>
							</div>
						</CardShell>
					</div>

					{/* RIGHT */}
					<div className='space-y-6 w-full lg:w-[360px]'>
						<div className='rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white shadow-sm'>
							<div className='flex items-center gap-2 text-white/90'>
								<FiLink />
								<div className='text-sm font-extrabold'>
									Need help connecting?
								</div>
							</div>

							<p className='mt-2 text-sm font-medium text-white/90'>
								Enable Moodle web services and generate a token. Then test and
								save the connection.
							</p>

							<Link
								href='/admin/integrations/moodle/docs'
								className='mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-white/20'
							>
								Read integration guide
								<FiExternalLink />
							</Link>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
