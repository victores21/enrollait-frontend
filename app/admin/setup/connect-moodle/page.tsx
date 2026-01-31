// 'use client';

// import Link from 'next/link';
// import { useCallback, useEffect, useMemo, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import {
// 	FiArrowLeft,
// 	FiArrowRight,
// 	FiExternalLink,
// 	FiHelpCircle,
// 	FiRefreshCw,
// 	FiXCircle,
// 	FiCheckCircle,
// } from 'react-icons/fi';

// import CardShell from '@/app/components/CardShell';
// import TextInputField from '@/app/components/TextInputField';
// import LoadingOverlay from '@/app/components/LoadingOverlay';
// import WizardStepper from '@/app/components/WizardStepper';
// import clsx from '@/lib/clsx';
// import { api } from '@/lib/api/api';

// type ConnState = 'idle' | 'testing' | 'ok' | 'error';
// type SaveState = 'idle' | 'saving';

// type MoodleConnectionMeta = {
// 	site_name?: string;
// 	moodle_username?: string;
// 	moodle_release?: string;
// 	moodle_version?: string;
// };

// type MoodleTestResponse = {
// 	connected: boolean;
// 	message: string;
// } & MoodleConnectionMeta;

// type MoodleConnectResponse = {
// 	connected: boolean;
// 	message: string;
// 	tenant_id: number;
// } & MoodleConnectionMeta;

// type MoodleSnapshot = {
// 	ok: boolean;
// 	tenant: {
// 		tenant_id: number;
// 		domain?: string | null;
// 		name?: string | null;
// 		moodle_configured: boolean;
// 		moodle_url?: string | null;
// 	};
// 	summary?: {
// 		categories_total: number;
// 		courses_total: number;
// 		products_total?: number;
// 		courses_last_sync_at?: string | null;
// 		categories_last_sync_at?: string | null;
// 	};
// };

// type ApiError = { message?: string };

// /** hostname only, no protocol/path */
// function getHostnameOnly(input: string): string {
// 	const raw = (input || '').trim();
// 	if (!raw) return '';
// 	try {
// 		const url = raw.startsWith('http')
// 			? new URL(raw)
// 			: new URL(`https://${raw}`);
// 		return url.hostname.replace(/^www\./, '').toLowerCase();
// 	} catch {
// 		return raw
// 			.replace(/^https?:\/\//, '')
// 			.replace(/\/.*$/, '')
// 			.replace(/:\d+$/, '')
// 			.replace(/^www\./, '')
// 			.toLowerCase();
// 	}
// }

// function tokenStorageKey(tenantId: number | null, domain: string) {
// 	if (tenantId) return `moodle_token_tenant_${tenantId}`;
// 	const d = getHostnameOnly(domain);
// 	return d ? `moodle_token_domain_${d}` : 'moodle_token_domain_unknown';
// }

// export default function ConnectMoodleWizardPage() {
// 	const router = useRouter();

// 	// wizard header
// 	const step = 1;
// 	const total = 4;

// 	// form
// 	const [moodleUrl, setMoodleUrl] = useState('');
// 	const [token, setToken] = useState('');

// 	// domain + tenant id (for local token storage + snapshot)
// 	const [domain, setDomain] = useState('');
// 	const [tenantId, setTenantId] = useState<number | null>(null);

// 	// snapshot
// 	const [snapshot, setSnapshot] = useState<MoodleSnapshot | null>(null);
// 	const [snapshotLoading, setSnapshotLoading] = useState(true);

// 	// UI states
// 	const [connState, setConnState] = useState<ConnState>('idle');
// 	const [saveState, setSaveState] = useState<SaveState>('idle');

// 	// detect domain
// 	useEffect(() => {
// 		const host =
// 			typeof window !== 'undefined'
// 				? window.location.hostname.replace(/^www\./, '').toLowerCase()
// 				: '';
// 		setDomain(host || '');
// 	}, []);

// 	const configured = !!snapshot?.tenant?.moodle_configured;

// 	// refresh snapshot (prefill moodle url + allow continue)
// 	const refreshSnapshot = useCallback(async () => {
// 		setSnapshotLoading(true);
// 		try {
// 			const snap = await api<MoodleSnapshot>('/integrations/moodle/snapshot', {
// 				method: 'GET',
// 				cache: 'no-store',
// 			});

// 			setSnapshot(snap);

// 			const tid = snap?.tenant?.tenant_id ?? null;
// 			setTenantId(tid);

// 			const urlFromDb = (snap?.tenant?.moodle_url || '').toString();
// 			if (urlFromDb && !moodleUrl.trim()) setMoodleUrl(urlFromDb);

// 			// If already configured, mark as OK so the UI shows "Connection successful"
// 			if (snap?.tenant?.moodle_configured) {
// 				setConnState('ok');
// 			}
// 		} catch (e: unknown) {
// 			const err = e as ApiError;
// 			console.error(err?.message ?? e);
// 		} finally {
// 			setSnapshotLoading(false);
// 		}
// 	}, [moodleUrl]);

// 	useEffect(() => {
// 		refreshSnapshot();
// 		// eslint-disable-next-line react-hooks/exhaustive-deps
// 	}, []);

// 	// token persistence (local only)
// 	useEffect(() => {
// 		if (typeof window === 'undefined') return;
// 		const key = tokenStorageKey(tenantId, domain);
// 		const saved = window.localStorage.getItem(key);
// 		if (saved && !token) setToken(saved);
// 		// eslint-disable-next-line react-hooks/exhaustive-deps
// 	}, [tenantId, domain]);

// 	useEffect(() => {
// 		if (typeof window === 'undefined') return;
// 		const key = tokenStorageKey(tenantId, domain);
// 		if (token) window.localStorage.setItem(key, token);
// 		else window.localStorage.removeItem(key);
// 	}, [token, tenantId, domain]);

// 	const canTest =
// 		!configured &&
// 		moodleUrl.trim().length > 0 &&
// 		token.trim().length > 0 &&
// 		connState !== 'testing' &&
// 		saveState !== 'saving';

// 	// If already configured, allow continue without requiring token input
// 	const canContinue = useMemo(() => {
// 		if (saveState === 'saving' || connState === 'testing') return false;
// 		if (configured) return true;
// 		return (
// 			connState === 'ok' &&
// 			moodleUrl.trim().length > 0 &&
// 			token.trim().length > 0
// 		);
// 	}, [configured, connState, saveState, moodleUrl, token]);

// 	async function onTestConnection() {
// 		setConnState('testing');

// 		try {
// 			const res = await api<MoodleTestResponse>('/integrations/moodle/test', {
// 				method: 'POST',
// 				headers: { 'Content-Type': 'application/json' },
// 				body: JSON.stringify({
// 					moodle_url: moodleUrl.trim(),
// 					token: token.trim(),
// 				}),
// 				cache: 'no-store',
// 			});

// 			setConnState(res.connected ? 'ok' : 'error');
// 		} catch (e: unknown) {
// 			const err = e as ApiError;
// 			setConnState('error');
// 			console.error(err?.message ?? e);
// 		}
// 	}

// 	async function onSaveAndContinue() {
// 		// If already configured, we can just go next step
// 		if (configured) {
// 			router.push('/admin/setup/sync-moodle');
// 			return;
// 		}

// 		setSaveState('saving');

// 		try {
// 			const res = await api<MoodleConnectResponse>(
// 				'/integrations/moodle/connect',
// 				{
// 					method: 'POST',
// 					headers: { 'Content-Type': 'application/json' },
// 					body: JSON.stringify({
// 						moodle_url: moodleUrl.trim(),
// 						token: token.trim(),
// 					}),
// 					cache: 'no-store',
// 				},
// 			);

// 			if (res.connected) {
// 				// refresh snapshot so future pages show configured
// 				await refreshSnapshot();
// 				router.push('/admin/setup/sync-moodle');
// 			} else {
// 				// If connect returns connected=false, show "error" state
// 				setConnState('error');
// 			}
// 		} catch (e: unknown) {
// 			const err = e as ApiError;
// 			console.error(err?.message ?? e);
// 			setConnState('error');
// 		} finally {
// 			setSaveState('idle');
// 		}
// 	}

// 	return (
// 		<main className='mx-auto max-w-[780px] px-4 py-10 md:px-6'>
// 			<LoadingOverlay
// 				show={
// 					snapshotLoading || connState === 'testing' || saveState === 'saving'
// 				}
// 				title={
// 					snapshotLoading
// 						? 'Loading…'
// 						: connState === 'testing'
// 							? 'Testing connection…'
// 							: 'Saving…'
// 				}
// 				message={
// 					snapshotLoading
// 						? 'Fetching current Moodle configuration.'
// 						: connState === 'testing'
// 							? 'Verifying your Moodle URL and token.'
// 							: 'Saving your Moodle configuration.'
// 				}
// 			/>

// 			<WizardStepper step={step} total={total} rightText='MOODLE INTEGRATION' />

// 			<div className='mt-8'>
// 				<CardShell title='Connect Moodle LMS'>
// 					<p className='text-sm font-semibold leading-6 text-slate-500'>
// 						Enter your Moodle site details to enable automatic course
// 						synchronization. We&apos;ll verify the connection before proceeding.
// 					</p>

// 					<div className='mt-8 space-y-7'>
// 						<TextInputField
// 							label='Moodle Site URL'
// 							hint='Example: https://your-school.moodlecloud.com'
// 							required
// 							type='url'
// 							value={moodleUrl}
// 							onChange={(v) => {
// 								setMoodleUrl(v);
// 								// If user edits, force re-test (unless already configured)
// 								if (!configured && connState === 'ok') setConnState('idle');
// 							}}
// 							placeholder='https://your-school.moodlecloud.com'
// 						/>

// 						{/* If already configured, token is optional (backend already has it).
// 						    But we still show it so user can update if they want. */}
// 						<TextInputField
// 							label='Web Service Token'
// 							hint={
// 								configured
// 									? 'Already configured. You can leave this blank unless you want to update it.'
// 									: 'Generate a token from Moodle Web Services.'
// 							}
// 							required={!configured}
// 							type='password'
// 							value={token}
// 							onChange={(v) => {
// 								setToken(v);
// 								if (!configured && connState === 'ok') setConnState('idle');
// 							}}
// 							placeholder='••••••••••••••••••••'
// 							autoComplete='off'
// 						/>

// 						<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
// 							<button
// 								type='button'
// 								onClick={onTestConnection}
// 								disabled={!canTest}
// 								className={clsx(
// 									'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold',
// 									canTest
// 										? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
// 										: 'cursor-not-allowed bg-slate-100 text-slate-400',
// 								)}
// 							>
// 								<FiRefreshCw
// 									className={clsx(
// 										'h-4 w-4',
// 										connState === 'testing' && 'animate-spin',
// 									)}
// 								/>
// 								Test Connection
// 							</button>

// 							{connState === 'ok' && (
// 								<div className='inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-extrabold text-emerald-700'>
// 									<FiCheckCircle className='h-4 w-4' />
// 									{configured ? 'Already configured' : 'Connection successful'}
// 								</div>
// 							)}

// 							{connState === 'error' && (
// 								<div className='inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-extrabold text-rose-700'>
// 									<FiXCircle className='h-4 w-4' />
// 									Connection failed
// 								</div>
// 							)}
// 						</div>

// 						<div className='rounded-2xl border border-slate-200 bg-slate-50 p-6'>
// 							<div className='flex items-start gap-4'>
// 								<div className='grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700'>
// 									<FiHelpCircle className='h-6 w-6' />
// 								</div>

// 								<div className='min-w-0'>
// 									<div className='text-base font-extrabold text-slate-900'>
// 										Need help finding your token?
// 									</div>

// 									<p className='mt-2 text-sm font-semibold leading-6 text-slate-600'>
// 										Go to{' '}
// 										<span className='rounded-md bg-white px-2 py-1 font-mono text-xs font-bold text-slate-700 shadow-sm'>
// 											Site Administration &gt; Plugins &gt; Web Services &gt;
// 											Manage Tokens
// 										</span>{' '}
// 										in your Moodle dashboard.
// 									</p>

// 									<Link
// 										href='/admin/integrations/moodle/docs'
// 										className='mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-blue-600 hover:text-blue-700'
// 									>
// 										Read integration documentation <FiExternalLink />
// 									</Link>
// 								</div>
// 							</div>
// 						</div>
// 					</div>
// 				</CardShell>
// 			</div>

// 			<div className='mt-8 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center'>
// 				<Link
// 					href='/admin/setup'
// 					className='inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50'
// 				>
// 					<FiArrowLeft className='h-4 w-4' />
// 					Back
// 				</Link>

// 				<button
// 					type='button'
// 					onClick={onSaveAndContinue}
// 					disabled={!canContinue}
// 					className={clsx(
// 						'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold text-white shadow-sm',
// 						canContinue
// 							? 'bg-blue-600 hover:bg-blue-700'
// 							: 'cursor-not-allowed bg-slate-300',
// 					)}
// 				>
// 					Save &amp; Continue <FiArrowRight className='h-4 w-4' />
// 				</button>
// 			</div>
// 		</main>
// 	);
// }

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	FiArrowLeft,
	FiArrowRight,
	FiExternalLink,
	FiHelpCircle,
	FiRefreshCw,
	FiXCircle,
	FiCheckCircle,
} from 'react-icons/fi';

import CardShell from '@/app/components/CardShell';
import TextInputField from '@/app/components/TextInputField';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import WizardStepper from '@/app/components/WizardStepper';
import clsx from '@/lib/clsx';
import { api } from '@/lib/api/api';

type ConnState = 'idle' | 'testing' | 'ok' | 'error';
type SaveState = 'idle' | 'saving';

type MoodleConnectionMeta = {
	site_name?: string;
	moodle_username?: string;
	moodle_release?: string;
	moodle_version?: string;
};

type MoodleTestResponse = {
	connected: boolean;
	message: string;
} & MoodleConnectionMeta;

type MoodleConnectResponse = {
	connected: boolean;
	message: string;
	tenant_id: number;
} & MoodleConnectionMeta;

type MoodleSnapshot = {
	ok: boolean;
	tenant: {
		tenant_id: number;
		domain?: string | null;
		name?: string | null;
		moodle_configured: boolean;
		moodle_url?: string | null;
	};
	summary?: {
		categories_total: number;
		courses_total: number;
		products_total?: number;
		courses_last_sync_at?: string | null;
		categories_last_sync_at?: string | null;
	};
};

type ApiError = { message?: string };

/** -----------------------------
 * NEW: onboarding endpoint types
 * ------------------------------*/
type OnboardingStepKey =
	| 'connect-moodle'
	| 'sync-moodle'
	| 'connect-stripe'
	| 'test-purchase';

type SetOnboardingStepPayload = {
	step: OnboardingStepKey;
	done?: boolean;
	meta?: Record<string, unknown>;
};

type SetOnboardingStepResponse = {
	ok: boolean;
	tenant_id: number;
	updated_step: OnboardingStepKey;
	current_step?: { key: string; label?: string; order?: number };
	progress?: { done: number; total: number; percent: number };
};

/** hostname only, no protocol/path */
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

function tokenStorageKey(tenantId: number | null, domain: string) {
	if (tenantId) return `moodle_token_tenant_${tenantId}`;
	const d = getHostnameOnly(domain);
	return d ? `moodle_token_domain_${d}` : 'moodle_token_domain_unknown';
}

export default function ConnectMoodleWizardPage() {
	const router = useRouter();

	// wizard header
	const step = 2;
	const total = 7;

	// form
	const [moodleUrl, setMoodleUrl] = useState('');
	const [token, setToken] = useState('');

	// domain + tenant id (for local token storage + snapshot)
	const [domain, setDomain] = useState('');
	const [tenantId, setTenantId] = useState<number | null>(null);

	// snapshot
	const [snapshot, setSnapshot] = useState<MoodleSnapshot | null>(null);
	const [snapshotLoading, setSnapshotLoading] = useState(true);

	// UI states
	const [connState, setConnState] = useState<ConnState>('idle');
	const [saveState, setSaveState] = useState<SaveState>('idle');

	// detect domain
	useEffect(() => {
		const host =
			typeof window !== 'undefined'
				? window.location.hostname.replace(/^www\./, '').toLowerCase()
				: '';
		setDomain(host || '');
	}, []);

	const configured = !!snapshot?.tenant?.moodle_configured;

	/** -----------------------------
	 * NEW: mark onboarding step done
	 * ------------------------------*/
	const markStepDone = useCallback(async () => {
		try {
			const payload: SetOnboardingStepPayload = {
				step: 'connect-moodle',
				done: true,
				meta: {
					source: 'connect-moodle-wizard',
					moodle_url: moodleUrl.trim() || undefined,
				},
			};

			await api<SetOnboardingStepResponse>('/onboarding/step', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				cache: 'no-store',
			});
		} catch (e) {
			// Do not block user if onboarding tracking fails
			console.warn('Failed to update onboarding step:', e);
		}
	}, [moodleUrl]);

	// refresh snapshot (prefill moodle url + allow continue)
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

			const urlFromDb = (snap?.tenant?.moodle_url || '').toString();
			if (urlFromDb && !moodleUrl.trim()) setMoodleUrl(urlFromDb);

			// If already configured, mark as OK so the UI shows "Connection successful"
			if (snap?.tenant?.moodle_configured) {
				setConnState('ok');
			}
		} catch (e: unknown) {
			const err = e as ApiError;
			console.error(err?.message ?? e);
		} finally {
			setSnapshotLoading(false);
		}
	}, [moodleUrl]);

	useEffect(() => {
		refreshSnapshot();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// token persistence (local only)
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

	const canTest =
		!configured &&
		moodleUrl.trim().length > 0 &&
		token.trim().length > 0 &&
		connState !== 'testing' &&
		saveState !== 'saving';

	// If already configured, allow continue without requiring token input
	const canContinue = useMemo(() => {
		if (saveState === 'saving' || connState === 'testing') return false;
		if (configured) return true;
		return (
			connState === 'ok' &&
			moodleUrl.trim().length > 0 &&
			token.trim().length > 0
		);
	}, [configured, connState, saveState, moodleUrl, token]);

	async function onTestConnection() {
		setConnState('testing');

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

			setConnState(res.connected ? 'ok' : 'error');
		} catch (e: unknown) {
			const err = e as ApiError;
			setConnState('error');
			console.error(err?.message ?? e);
		}
	}

	async function onSaveAndContinue() {
		// If already configured, mark onboarding + go next step
		if (configured) {
			await markStepDone();
			router.push('/admin/setup/sync-moodle');
			return;
		}

		setSaveState('saving');

		try {
			const res = await api<MoodleConnectResponse>(
				'/integrations/moodle/connect',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						moodle_url: moodleUrl.trim(),
						token: token.trim(),
					}),
					cache: 'no-store',
				},
			);

			if (res.connected) {
				// refresh snapshot so future pages show configured
				await refreshSnapshot();

				// ✅ NEW: mark onboarding step done
				await markStepDone();

				router.push('/admin/setup/sync-moodle');
			} else {
				setConnState('error');
			}
		} catch (e: unknown) {
			const err = e as ApiError;
			console.error(err?.message ?? e);
			setConnState('error');
		} finally {
			setSaveState('idle');
		}
	}

	return (
		<main className='mx-auto max-w-[780px] px-4 py-10 md:px-6'>
			<LoadingOverlay
				show={
					snapshotLoading || connState === 'testing' || saveState === 'saving'
				}
				title={
					snapshotLoading
						? 'Loading…'
						: connState === 'testing'
							? 'Testing connection…'
							: 'Saving…'
				}
				message={
					snapshotLoading
						? 'Fetching current Moodle configuration.'
						: connState === 'testing'
							? 'Verifying your Moodle URL and token.'
							: 'Saving your Moodle configuration.'
				}
			/>

			<WizardStepper step={step} total={total} rightText='MOODLE INTEGRATION' />

			<div className='mt-8'>
				<CardShell title='Connect Moodle LMS'>
					<p className='text-sm font-semibold leading-6 text-slate-500'>
						Enter your Moodle site details to enable automatic course
						synchronization. We&apos;ll verify the connection before proceeding.
					</p>

					<div className='mt-8 space-y-7'>
						<TextInputField
							label='Moodle Site URL'
							hint='Example: https://your-school.moodlecloud.com'
							required
							type='url'
							value={moodleUrl}
							onChange={(v) => {
								setMoodleUrl(v);
								if (!configured && connState === 'ok') setConnState('idle');
							}}
							placeholder='https://your-school.moodlecloud.com'
						/>

						<TextInputField
							label='Web Service Token'
							hint={
								configured
									? 'Already configured. You can leave this blank unless you want to update it.'
									: 'Generate a token from Moodle Web Services.'
							}
							required={!configured}
							type='password'
							value={token}
							onChange={(v) => {
								setToken(v);
								if (!configured && connState === 'ok') setConnState('idle');
							}}
							placeholder='••••••••••••••••••••'
							autoComplete='off'
						/>

						<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
							<button
								type='button'
								onClick={onTestConnection}
								disabled={!canTest}
								className={clsx(
									'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold',
									canTest
										? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
										: 'cursor-not-allowed bg-slate-100 text-slate-400',
								)}
							>
								<FiRefreshCw
									className={clsx(
										'h-4 w-4',
										connState === 'testing' && 'animate-spin',
									)}
								/>
								Test Connection
							</button>

							{connState === 'ok' && (
								<div className='inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-extrabold text-emerald-700'>
									<FiCheckCircle className='h-4 w-4' />
									{configured ? 'Already configured' : 'Connection successful'}
								</div>
							)}

							{connState === 'error' && (
								<div className='inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-extrabold text-rose-700'>
									<FiXCircle className='h-4 w-4' />
									Connection failed
								</div>
							)}
						</div>

						<div className='rounded-2xl border border-slate-200 bg-slate-50 p-6'>
							<div className='flex items-start gap-4'>
								<div className='grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700'>
									<FiHelpCircle className='h-6 w-6' />
								</div>

								<div className='min-w-0'>
									<div className='text-base font-extrabold text-slate-900'>
										Need help finding your token?
									</div>

									<p className='mt-2 text-sm font-semibold leading-6 text-slate-600'>
										Go to{' '}
										<span className='rounded-md bg-white px-2 py-1 font-mono text-xs font-bold text-slate-700 shadow-sm'>
											Site Administration &gt; Plugins &gt; Web Services &gt;
											Manage Tokens
										</span>{' '}
										in your Moodle dashboard.
									</p>

									<Link
										href='/admin/integrations/moodle/docs'
										className='mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-blue-600 hover:text-blue-700'
									>
										Read integration documentation <FiExternalLink />
									</Link>
								</div>
							</div>
						</div>
					</div>
				</CardShell>
			</div>

			<div className='mt-8 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center'>
				<Link
					href='/admin/setup'
					className='inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50'
				>
					<FiArrowLeft className='h-4 w-4' />
					Back
				</Link>

				<button
					type='button'
					onClick={onSaveAndContinue}
					disabled={!canContinue}
					className={clsx(
						'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold text-white shadow-sm',
						canContinue
							? 'bg-blue-600 hover:bg-blue-700'
							: 'cursor-not-allowed bg-slate-300',
					)}
				>
					Save &amp; Continue <FiArrowRight className='h-4 w-4' />
				</button>
			</div>
		</main>
	);
}
