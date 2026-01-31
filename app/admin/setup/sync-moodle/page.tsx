// 'use client';

// import Link from 'next/link';
// import { useCallback, useEffect, useMemo, useState } from 'react';
// import {
// 	FiArrowLeft,
// 	FiArrowRight,
// 	FiRefreshCw,
// 	FiRepeat,
// 	FiCheckCircle,
// 	FiXCircle,
// } from 'react-icons/fi';

// import LoadingOverlay from '@/app/components/LoadingOverlay';
// import WizardStepper from '@/app/components/WizardStepper';
// import clsx from '@/lib/clsx';
// import { api } from '@/lib/api/api';

// type SyncState = 'idle' | 'syncing' | 'done' | 'error';

// type MoodleSyncResponse = {
// 	ok: boolean;
// 	tenant_id: number;
// 	fetched_from_moodle: number;
// 	upserted: number;
// 	message: string;
// };

// type MoodleSnapshot = {
// 	ok: boolean;
// 	tenant: {
// 		tenant_id: number;
// 		domain?: string | null;
// 		name?: string | null;
// 		moodle_configured: boolean;
// 		moodle_url?: string | null;
// 	};
// 	summary: {
// 		categories_total: number;
// 		courses_total: number;
// 		products_total?: number;
// 		courses_last_sync_at?: string | null;
// 		categories_last_sync_at?: string | null;
// 	};
// };

// type ApiError = { message?: string };

// function Banner({
// 	variant,
// 	title,
// 	body,
// 	onClose,
// }: {
// 	variant: 'success' | 'error' | 'info';
// 	title: string;
// 	body?: string;
// 	onClose?: () => void;
// }) {
// 	return (
// 		<div
// 			className={clsx(
// 				'rounded-2xl border px-4 py-3',
// 				variant === 'success' && 'border-emerald-200 bg-emerald-50',
// 				variant === 'error' && 'border-rose-200 bg-rose-50',
// 				variant === 'info' && 'border-slate-200 bg-slate-50',
// 			)}
// 		>
// 			<div className='flex items-center justify-between gap-3'>
// 				<div className='min-w-0'>
// 					<div
// 						className={clsx(
// 							'text-sm font-extrabold',
// 							variant === 'success' && 'text-emerald-700',
// 							variant === 'error' && 'text-rose-700',
// 							variant === 'info' && 'text-slate-700',
// 						)}
// 					>
// 						{title}
// 					</div>
// 					{body ? (
// 						<div className='mt-0.5 whitespace-pre-wrap text-xs font-semibold text-slate-600'>
// 							{body}
// 						</div>
// 					) : null}
// 				</div>

// 				{onClose ? (
// 					<button
// 						onClick={onClose}
// 						className='rounded-lg p-1 text-slate-400 hover:bg-white/60 hover:text-slate-600'
// 						aria-label='Close'
// 						type='button'
// 					>
// 						✕
// 					</button>
// 				) : null}
// 			</div>
// 		</div>
// 	);
// }

// export default function SyncLmsWizardPage() {
// 	const step = 3; // usually: 1 connect -> 2 test/save -> 3 sync
// 	const total = 7;

// 	// server state
// 	const [snapshot, setSnapshot] = useState<MoodleSnapshot | null>(null);
// 	const [snapshotLoading, setSnapshotLoading] = useState(true);

// 	// sync metrics (UI)
// 	const [inserted, setInserted] = useState(0);
// 	const [updated, setUpdated] = useState(0);
// 	const [totalSynced, setTotalSynced] = useState(0);
// 	const [lastSync, setLastSync] = useState<'Never' | string>('Never');

// 	const [syncState, setSyncState] = useState<SyncState>('idle');

// 	const [banner, setBanner] = useState<{
// 		variant: 'success' | 'error' | 'info';
// 		title: string;
// 		body?: string;
// 	} | null>(null);

// 	const configured = !!snapshot?.tenant?.moodle_configured;

// 	const refreshSnapshot = useCallback(async () => {
// 		setSnapshotLoading(true);
// 		try {
// 			const snap = await api<MoodleSnapshot>('/integrations/moodle/snapshot', {
// 				method: 'GET',
// 				cache: 'no-store',
// 			});
// 			setSnapshot(snap);
// 		} catch (e: unknown) {
// 			const err = e as ApiError;
// 			console.error(err?.message ?? e);
// 		} finally {
// 			setSnapshotLoading(false);
// 		}
// 	}, []);

// 	useEffect(() => {
// 		refreshSnapshot();
// 	}, [refreshSnapshot]);

// 	const stats = useMemo(
// 		() => [
// 			{ label: 'INSERTED', value: String(inserted) },
// 			{ label: 'UPDATED', value: String(updated) },
// 			{ label: 'TOTAL', value: String(totalSynced) },
// 			{ label: 'LAST SYNC', value: lastSync },
// 		],
// 		[inserted, updated, totalSynced, lastSync],
// 	);

// 	const canSync = configured && syncState !== 'syncing';
// 	const canContinue = syncState === 'done';

// 	async function onSyncAll() {
// 		if (!configured) {
// 			setBanner({
// 				variant: 'error',
// 				title: 'Moodle not configured',
// 				body: 'Please go back and save your Moodle connection first.',
// 			});
// 			return;
// 		}

// 		setSyncState('syncing');
// 		setBanner(null);

// 		try {
// 			// 1) Sync courses
// 			const coursesRes = await api<MoodleSyncResponse>(
// 				'/integrations/moodle/sync-courses',
// 				{
// 					method: 'POST',
// 					headers: { 'Content-Type': 'application/json' },
// 					body: JSON.stringify({}),
// 					cache: 'no-store',
// 				},
// 			);

// 			if (!coursesRes.ok) {
// 				setSyncState('error');
// 				setBanner({
// 					variant: 'error',
// 					title: 'Courses sync failed',
// 					body: coursesRes.message,
// 				});
// 				return;
// 			}

// 			// 2) Sync categories
// 			const catsRes = await api<MoodleSyncResponse>(
// 				'/integrations/moodle/sync-categories',
// 				{
// 					method: 'POST',
// 					headers: { 'Content-Type': 'application/json' },
// 					body: JSON.stringify({}),
// 					cache: 'no-store',
// 				},
// 			);

// 			if (!catsRes.ok) {
// 				setSyncState('error');
// 				setBanner({
// 					variant: 'error',
// 					title: 'Categories sync failed',
// 					body: catsRes.message,
// 				});
// 				return;
// 			}

// 			// --- Metrics
// 			// Backend only returns `upserted` and `fetched_from_moodle`.
// 			// We can’t know inserted vs updated without backend changes,
// 			// so we approximate:
// 			const upsertedTotal =
// 				(coursesRes.upserted || 0) + (catsRes.upserted || 0);
// 			const fetchedTotal =
// 				(coursesRes.fetched_from_moodle || 0) +
// 				(catsRes.fetched_from_moodle || 0);

// 			setInserted(upsertedTotal);
// 			setUpdated(0);
// 			setTotalSynced(upsertedTotal);

// 			setLastSync(new Date().toLocaleString());

// 			setBanner({
// 				variant: 'success',
// 				title: 'Sync complete ✅',
// 				body: `Courses: ${coursesRes.message}\nCategories: ${catsRes.message}\nFetched: ${fetchedTotal} • Upserted: ${upsertedTotal}`,
// 			});

// 			await refreshSnapshot();
// 			setSyncState('done');
// 		} catch (e: unknown) {
// 			const err = e as ApiError;
// 			setSyncState('error');
// 			setBanner({
// 				variant: 'error',
// 				title: 'Sync failed',
// 				body: err?.message ?? 'Unexpected error syncing Moodle data.',
// 			});
// 		}
// 	}

// 	return (
// 		<main className='mx-auto max-w-[780px] px-4 py-8 md:px-6'>
// 			<LoadingOverlay
// 				show={snapshotLoading || syncState === 'syncing'}
// 				title={syncState === 'syncing' ? 'Syncing…' : 'Loading…'}
// 				message={
// 					syncState === 'syncing'
// 						? 'Fetching courses and categories from Moodle and updating your database.'
// 						: 'Fetching current Moodle configuration.'
// 				}
// 			/>

// 			<WizardStepper step={step} total={total} rightText='MOODLE INTEGRATION' />

// 			<div className='mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm'>
// 				<div className='h-[220px] w-full bg-gradient-to-r from-slate-800 via-cyan-700 to-slate-800' />

// 				<div className='p-6 sm:p-8'>
// 					<div className='flex items-start gap-4'>
// 						<div className='grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600'>
// 							<FiRepeat className='h-6 w-6' />
// 						</div>

// 						<div className='min-w-0'>
// 							<div className='text-xs font-extrabold tracking-widest text-slate-400'>
// 								MOODLE INTEGRATION
// 							</div>
// 							<h1 className='mt-2 text-4xl font-extrabold tracking-tight text-slate-900'>
// 								Sync Courses & Categories
// 							</h1>
// 							<p className='mt-3 max-w-[760px] text-base font-medium leading-7 text-slate-500'>
// 								This will import your course catalog and categories from your
// 								connected Moodle instance. It will add new records and update
// 								existing ones.
// 							</p>

// 							{/* quick config status */}
// 							<div className='mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold'>
// 								{configured ? (
// 									<>
// 										<FiCheckCircle className='h-4 w-4 text-emerald-600' />
// 										<span className='text-emerald-700'>Configured</span>
// 									</>
// 								) : (
// 									<>
// 										<FiXCircle className='h-4 w-4 text-rose-600' />
// 										<span className='text-rose-700'>Not configured</span>
// 									</>
// 								)}
// 							</div>

// 							{configured && snapshot?.tenant?.moodle_url ? (
// 								<div className='mt-2 text-xs font-semibold text-slate-500'>
// 									Using:{' '}
// 									<span className='font-mono font-bold text-slate-700'>
// 										{snapshot.tenant.moodle_url}
// 									</span>
// 								</div>
// 							) : null}
// 						</div>
// 					</div>

// 					{/* Primary action */}
// 					<div className='mt-10 flex justify-center'>
// 						<button
// 							type='button'
// 							onClick={onSyncAll}
// 							disabled={!canSync}
// 							className={clsx(
// 								'inline-flex w-full max-w-[560px] items-center justify-center gap-3 rounded-full px-8 py-4 text-base font-extrabold text-white shadow-sm',
// 								canSync
// 									? 'bg-blue-600 hover:bg-blue-700'
// 									: 'cursor-not-allowed bg-slate-300',
// 							)}
// 						>
// 							<FiRefreshCw
// 								className={clsx(
// 									'h-5 w-5',
// 									syncState === 'syncing' && 'animate-spin',
// 								)}
// 							/>
// 							Sync courses & categories from Moodle
// 						</button>
// 					</div>
// 					{banner && (
// 						<div className='w-full flex  mt-6 justify-center'>
// 							<div className='inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-extrabold text-emerald-700'>
// 								<FiCheckCircle className='h-4 w-4' />
// 								Sync completed
// 							</div>
// 						</div>
// 					)}
// 				</div>

// 				{/* Footer actions */}
// 				<div className='flex flex-col items-stretch justify-between gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:px-8'>
// 					<Link
// 						href='/admin/setup/connect-moodle'
// 						className='inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50'
// 					>
// 						<FiArrowLeft className='h-4 w-4' />
// 						Back
// 					</Link>

// 					<Link
// 						href='/admin/setup/test-purchase' // change to your next step
// 						aria-disabled={!canContinue}
// 						className={clsx(
// 							'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-extrabold',
// 							canContinue
// 								? 'bg-blue-600 text-white hover:bg-blue-700'
// 								: 'pointer-events-none bg-slate-200 text-slate-500',
// 						)}
// 					>
// 						Continue <FiArrowRight className='h-4 w-4' />
// 					</Link>
// 				</div>
// 			</div>

// 			<div className='mt-6 text-center text-sm font-semibold text-slate-400'>
// 				Having trouble? Ensure your{' '}
// 				<Link
// 					href='/admin/setup/connect-moodle'
// 					className='font-extrabold text-blue-600 hover:text-blue-700'
// 				>
// 					Moodle connection
// 				</Link>{' '}
// 				is correctly configured first.
// 			</div>
// 		</main>
// 	);
// }

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	FiArrowLeft,
	FiArrowRight,
	FiRefreshCw,
	FiRepeat,
	FiCheckCircle,
	FiXCircle,
} from 'react-icons/fi';

import LoadingOverlay from '@/app/components/LoadingOverlay';
import WizardStepper from '@/app/components/WizardStepper';
import clsx from '@/lib/clsx';
import { api } from '@/lib/api/api';
import { toast } from 'sonner';

type SyncState = 'idle' | 'syncing' | 'done' | 'error';

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
		products_total?: number;
		courses_last_sync_at?: string | null;
		categories_last_sync_at?: string | null;
	};
};

type OnboardingStepKey =
	| 'connect-moodle'
	| 'sync-moodle'
	| 'connect-stripe'
	| 'test-purchase';

type OnboardingStepItem = {
	step: OnboardingStepKey;
	done: boolean;
	meta?: Record<string, unknown> | null;
	updated_at?: string | null;
};

type OnboardingStateResponse = {
	ok: boolean;
	tenant_id: number;
	current_step: OnboardingStepKey;
	steps: OnboardingStepItem[];
};

type OnboardingStepPayload = {
	step: OnboardingStepKey;
	done: boolean;
	meta?: Record<string, unknown>;
};

type OnboardingStepResponse = {
	ok: boolean;
	tenant_id: number;
	step: OnboardingStepKey;
	done: boolean;
	current_step?: OnboardingStepKey;
};

type ApiError = { message?: string };

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

function stepDone(steps: OnboardingStepItem[] | null, step: OnboardingStepKey) {
	if (!steps?.length) return false;
	return steps.some((s) => s.step === step && !!s.done);
}

export default function SyncLmsWizardPage() {
	const step = 2; // usually: connect -> test/save -> sync
	const total = 4;

	// server state
	const [snapshot, setSnapshot] = useState<MoodleSnapshot | null>(null);
	const [snapshotLoading, setSnapshotLoading] = useState(true);

	// onboarding
	const [onboarding, setOnboarding] = useState<OnboardingStateResponse | null>(
		null,
	);
	const [onboardingLoading, setOnboardingLoading] = useState(true);

	// sync metrics (UI)
	const [inserted, setInserted] = useState(0);
	const [updated, setUpdated] = useState(0);
	const [totalSynced, setTotalSynced] = useState(0);
	const [lastSync, setLastSync] = useState<'Never' | string>('Never');

	const [syncState, setSyncState] = useState<SyncState>('idle');

	const [banner, setBanner] = useState<{
		variant: 'success' | 'error' | 'info';
		title: string;
		body?: string;
	} | null>(null);

	const configured = !!snapshot?.tenant?.moodle_configured;

	const refreshSnapshot = useCallback(async () => {
		setSnapshotLoading(true);
		try {
			const snap = await api<MoodleSnapshot>('/integrations/moodle/snapshot', {
				method: 'GET',
				cache: 'no-store',
			});
			setSnapshot(snap);
		} catch (e: unknown) {
			const err = e as ApiError;
			console.error(err?.message ?? e);
		} finally {
			setSnapshotLoading(false);
		}
	}, []);

	const refreshOnboarding = useCallback(async () => {
		setOnboardingLoading(true);
		try {
			const state = await api<OnboardingStateResponse>('/onboarding/state', {
				method: 'GET',
				cache: 'no-store',
			});
			if (state?.ok) {
				setOnboarding(state);

				// If the user already completed this step earlier, reflect that in UI
				if (stepDone(state.steps, 'sync-moodle')) {
					setSyncState('done');
				}
			}
		} catch (e: unknown) {
			// onboarding is not critical; don't block the page
			const err = e as ApiError;
			console.error(err?.message ?? e);
		} finally {
			setOnboardingLoading(false);
		}
	}, []);

	useEffect(() => {
		refreshSnapshot();
		refreshOnboarding();
	}, [refreshSnapshot, refreshOnboarding]);

	const stats = useMemo(
		() => [
			{ label: 'INSERTED', value: String(inserted) },
			{ label: 'UPDATED', value: String(updated) },
			{ label: 'TOTAL', value: String(totalSynced) },
			{ label: 'LAST SYNC', value: lastSync },
		],
		[inserted, updated, totalSynced, lastSync],
	);

	const canSync = configured && syncState !== 'syncing';

	const isSyncMoodleDone =
		syncState === 'done' || stepDone(onboarding?.steps ?? null, 'sync-moodle');

	const canContinue = isSyncMoodleDone;

	async function markOnboardingStepDone(meta?: Record<string, unknown>) {
		try {
			const payload: OnboardingStepPayload = {
				step: 'sync-moodle',
				done: true,
				meta: meta ?? { source: 'sync-moodle-wizard' },
			};

			await api<OnboardingStepResponse>('/onboarding/step', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				cache: 'no-store',
			});

			// refresh local onboarding state (best effort)
			await refreshOnboarding();
		} catch (e: unknown) {
			// non-blocking
			const err = e as ApiError;
			console.error(err?.message ?? e);
		}
	}

	async function onSyncAll() {
		if (!configured) {
			setBanner({
				variant: 'error',
				title: 'Moodle not configured',
				body: 'Please go back and save your Moodle connection first.',
			});
			return;
		}

		setSyncState('syncing');
		setBanner(null);

		try {
			// 1) Sync courses
			const coursesRes = await api<MoodleSyncResponse>(
				'/integrations/moodle/sync-courses',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({}),
					cache: 'no-store',
				},
			);

			if (!coursesRes.ok) {
				setSyncState('error');
				setBanner({
					variant: 'error',
					title: 'Courses sync failed',
					body: coursesRes.message,
				});
				return;
			}

			// 2) Sync categories
			const catsRes = await api<MoodleSyncResponse>(
				'/integrations/moodle/sync-categories',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({}),
					cache: 'no-store',
				},
			);

			if (!catsRes.ok) {
				setSyncState('error');
				setBanner({
					variant: 'error',
					title: 'Categories sync failed',
					body: catsRes.message,
				});
				return;
			}

			// Metrics (approx)
			const upsertedTotal =
				(coursesRes.upserted || 0) + (catsRes.upserted || 0);
			const fetchedTotal =
				(coursesRes.fetched_from_moodle || 0) +
				(catsRes.fetched_from_moodle || 0);

			setInserted(upsertedTotal);
			setUpdated(0);
			setTotalSynced(upsertedTotal);
			setLastSync(new Date().toLocaleString());

			setBanner({
				variant: 'success',
				title: 'Sync complete',
				body: `Courses: ${coursesRes.message}\nCategories: ${catsRes.message}\nFetched: ${fetchedTotal} • Upserted: ${upsertedTotal}`,
			});

			// ✅ Mark onboarding step "sync-moodle" as done
			await markOnboardingStepDone({
				source: 'sync-moodle-wizard',
				moodle_url: snapshot?.tenant?.moodle_url ?? null,
				fetched_total: fetchedTotal,
				upserted_total: upsertedTotal,
			});

			await refreshSnapshot();
			toast.success('Sync complete');
			setSyncState('done');
		} catch (e: unknown) {
			const err = e as ApiError;
			setSyncState('error');
			setBanner({
				variant: 'error',
				title: 'Sync failed',
				body: err?.message ?? 'Unexpected error syncing Moodle data.',
			});
		}
	}

	return (
		<main className='mx-auto max-w-[780px] px-4 py-8 md:px-6'>
			<LoadingOverlay
				show={snapshotLoading || onboardingLoading || syncState === 'syncing'}
				title={syncState === 'syncing' ? 'Syncing…' : 'Loading…'}
				message={
					syncState === 'syncing'
						? 'Fetching courses and categories from Moodle and updating your database.'
						: 'Fetching current configuration.'
				}
			/>

			<WizardStepper step={step} total={total} rightText='MOODLE INTEGRATION' />

			<div className='mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm'>
				<div className='h-[220px] w-full bg-gradient-to-r from-slate-800 via-cyan-700 to-slate-800' />

				<div className='p-6 sm:p-8'>
					<div className='flex items-start gap-4'>
						<div className='grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600'>
							<FiRepeat className='h-6 w-6' />
						</div>

						<div className='min-w-0'>
							<div className='text-xs font-extrabold tracking-widest text-slate-400'>
								MOODLE INTEGRATION
							</div>
							<h1 className='mt-2 text-4xl font-extrabold tracking-tight text-slate-900'>
								Sync Courses & Categories
							</h1>
							<p className='mt-3 max-w-[760px] text-base font-medium leading-7 text-slate-500'>
								This will import your course catalog and categories from your
								connected Moodle instance. It will add new records and update
								existing ones.
							</p>

							{/* quick config status */}
							<div className='mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold'>
								{configured ? (
									<>
										<FiCheckCircle className='h-4 w-4 text-emerald-600' />
										<span className='text-emerald-700'>Configured</span>
									</>
								) : (
									<>
										<FiXCircle className='h-4 w-4 text-rose-600' />
										<span className='text-rose-700'>Not configured</span>
									</>
								)}
							</div>

							{configured && snapshot?.tenant?.moodle_url ? (
								<div className='mt-2 text-xs font-semibold text-slate-500'>
									Using:{' '}
									<span className='font-mono font-bold text-slate-700'>
										{snapshot.tenant.moodle_url}
									</span>
								</div>
							) : null}
						</div>
					</div>

					{/* Primary action */}
					<div className='mt-10 flex justify-center'>
						<button
							type='button'
							onClick={onSyncAll}
							disabled={!canSync}
							className={clsx(
								'inline-flex w-full max-w-[560px] items-center justify-center gap-3 rounded-full px-8 py-4 text-base font-extrabold text-white shadow-sm',
								canSync
									? 'bg-blue-600 hover:bg-blue-700'
									: 'cursor-not-allowed bg-slate-300',
							)}
						>
							<FiRefreshCw
								className={clsx(
									'h-5 w-5',
									syncState === 'syncing' && 'animate-spin',
								)}
							/>
							Sync courses & categories from Moodle
						</button>
					</div>

					{/* Banner */}
					<div className='mt-6 space-y-3'>
						{banner ? (
							<Banner
								variant={banner.variant}
								title={'Sync completed'}
								onClose={() => setBanner(null)}
							/>
						) : null}
					</div>
				</div>

				{/* Footer actions */}
				<div className='flex flex-col items-stretch justify-between gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:px-8'>
					<Link
						href='/admin/setup/connect-moodle'
						className='inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50'
					>
						<FiArrowLeft className='h-4 w-4' />
						Back
					</Link>

					<Link
						href='/admin/setup/connect-stripe'
						aria-disabled={!canContinue}
						className={clsx(
							'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-2.5 text-sm font-extrabold',
							canContinue
								? 'bg-blue-600 text-white hover:bg-blue-700'
								: 'pointer-events-none bg-slate-200 text-slate-500',
						)}
					>
						Continue <FiArrowRight className='h-4 w-4' />
					</Link>
				</div>
			</div>

			<div className='mt-6 text-center text-sm font-semibold text-slate-400'>
				Having trouble? Ensure your{' '}
				<Link
					href='/admin/setup/connect-moodle'
					className='font-extrabold text-blue-600 hover:text-blue-700'
				>
					Moodle connection
				</Link>{' '}
				is correctly configured first.
			</div>
		</main>
	);
}
