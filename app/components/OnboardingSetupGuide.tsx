'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from '@/lib/clsx';
import {
	FiCheck,
	FiChevronDown,
	FiChevronUp,
	FiX,
	FiExternalLink,
	FiLock,
} from 'react-icons/fi';
import { Portal } from 'react-portal';

type OnboardingStepKey =
	| 'connect-moodle'
	| 'sync-moodle'
	| 'connect-stripe'
	| 'test-purchase';

type OnboardingStepItem = {
	key: OnboardingStepKey;
	label: string;
	order: number;
	done: boolean;
	completed_at: string | null;
	meta?: Record<string, unknown> | null;
};

type OnboardingStateResponse = {
	ok: boolean;
	tenant_id: number;
	steps: OnboardingStepItem[];
	current_step: {
		key: OnboardingStepKey;
		label: string;
		order: number;
	};
	progress: {
		done: number;
		total: number;
		percent: number;
	};
};

type StepUi = {
	key: OnboardingStepKey;
	label: string;
	href: string;
	done: boolean;
	order: number;
};

type Section = {
	id: 'moodle' | 'stripe' | 'finish';
	title: string;
	steps: StepUi[];
};

type Props = {
	disabled?: boolean;
	endpoint?: string; // default: '/onboarding/state'
	position?: 'bottom-right' | 'bottom-left';
};

const STORAGE_DISMISSED = 'setup_guide_dismissed';
const STORAGE_OPEN = 'setup_guide_open_sections';

/** ✅ New: once all steps are complete, hide forever */
const STORAGE_HIDDEN_COMPLETED = 'setup_guide_hidden_completed';

export default function OnboardingSetupGuide({
	disabled = false,
	endpoint = '/onboarding/state',
	position = 'bottom-right',
}: Props) {
	const router = useRouter();

	// ✅ prevent hydration mismatch with Portal
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<OnboardingStateResponse | null>(null);

	// UI state
	const [dismissed, setDismissed] = useState(false);
	const [animatingOut, setAnimatingOut] = useState(false);

	// ✅ New: if user completed onboarding at some point, never show again
	const [hiddenCompleted, setHiddenCompleted] = useState(false);

	// sections state
	const [openSections, setOpenSections] = useState<Record<string, boolean>>({
		moodle: true,
		stripe: true,
		finish: true,
	});

	// restore UI state
	useEffect(() => {
		if (!mounted) return;

		const d = window.localStorage.getItem(STORAGE_DISMISSED);
		if (d === '1') setDismissed(true);

		const s = window.localStorage.getItem(STORAGE_OPEN);
		if (s) {
			try {
				const parsed = JSON.parse(s) as Record<string, boolean>;
				setOpenSections((prev) => ({ ...prev, ...parsed }));
			} catch {
				// ignore
			}
		}

		// ✅ New: restore "completed = hide forever"
		const hc = window.localStorage.getItem(STORAGE_HIDDEN_COMPLETED);
		if (hc === '1') setHiddenCompleted(true);
	}, [mounted]);

	// persist UI state
	useEffect(() => {
		if (!mounted) return;
		window.localStorage.setItem(STORAGE_DISMISSED, dismissed ? '1' : '0');
	}, [dismissed, mounted]);

	useEffect(() => {
		if (!mounted) return;
		window.localStorage.setItem(STORAGE_OPEN, JSON.stringify(openSections));
	}, [openSections, mounted]);

	// ✅ New: persist hiddenCompleted
	useEffect(() => {
		if (!mounted) return;
		window.localStorage.setItem(
			STORAGE_HIDDEN_COMPLETED,
			hiddenCompleted ? '1' : '0',
		);
	}, [hiddenCompleted, mounted]);

	async function fetchState() {
		setLoading(true);
		setError(null);

		try {
			const mod = await import('@/lib/api/api');
			const api = mod.api as <T>(
				path: string,
				init?: RequestInit,
			) => Promise<T>;

			const res = await api<OnboardingStateResponse>(endpoint, {
				method: 'GET',
				cache: 'no-store',
			});

			if (!res?.ok) {
				setError('Onboarding state returned ok=false');
				setData(null);
			} else {
				setData(res);
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			setError(e?.message ?? 'Failed to load onboarding state');
			setData(null);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		if (disabled) return;
		if (!mounted) return;
		if (hiddenCompleted) return; // ✅ New: no need to fetch or render
		fetchState();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [disabled, endpoint, mounted, hiddenCompleted]);

	const stepHref: Record<OnboardingStepKey, string> = {
		'connect-moodle': '/admin/setup/connect-moodle',
		'sync-moodle': '/admin/setup/sync-moodle',
		'connect-stripe': '/admin/setup/connect-stripe',
		'test-purchase': '/admin/setup/test-purchase',
	};

	const stepsByKey = useMemo(() => {
		const map: Record<OnboardingStepKey, OnboardingStepItem | undefined> = {
			'connect-moodle': undefined,
			'sync-moodle': undefined,
			'connect-stripe': undefined,
			'test-purchase': undefined,
		};
		for (const s of data?.steps || []) map[s.key] = s;
		return map;
	}, [data]);

	const percent = data?.progress?.percent ?? 0;
	const doneCount = data?.progress?.done ?? 0;
	const totalCount = data?.progress?.total ?? 4;
	const allDone = totalCount > 0 && doneCount >= totalCount;

	// ✅ New: once backend says all done, hide forever (and remove pill state)
	useEffect(() => {
		if (!mounted) return;
		if (!loading && !error && data?.ok && allDone) {
			setHiddenCompleted(true);
			setDismissed(false);
			setAnimatingOut(false);
		}
	}, [allDone, data?.ok, error, loading, mounted]);

	const nextStepLabel = data?.current_step?.label || 'Continue setup';
	const nextStepHref = data?.current_step?.key
		? stepHref[data.current_step.key]
		: '/admin/setup';

	const sections: Section[] = useMemo(() => {
		const mk = (key: OnboardingStepKey, fallbackLabel: string): StepUi => {
			const s = stepsByKey[key];
			return {
				key,
				label: s?.label || fallbackLabel,
				href: stepHref[key],
				done: !!s?.done,
				order: s?.order ?? 999,
			};
		};

		return [
			{
				id: 'moodle',
				title: 'Set up Moodle',
				steps: [
					mk('connect-moodle', 'Connect Moodle'),
					mk('sync-moodle', 'Sync Moodle'),
				],
			},
			{
				id: 'stripe',
				title: 'Set up Stripe',
				steps: [mk('connect-stripe', 'Connect Stripe')],
			},
			{
				id: 'finish',
				title: 'Finish your setup',
				steps: [mk('test-purchase', 'Test Purchase')],
			},
		];
	}, [stepsByKey]);

	function goToStep(step: StepUi) {
		setDismissed(false);
		router.push(step.href);
	}

	function toggleSection(id: string) {
		setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
	}

	const posClass =
		position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6';

	if (disabled) return null;
	if (!mounted) return null;

	// ✅ New: hide completely once all done
	if (hiddenCompleted) return null;

	function dismissWithAnim() {
		setAnimatingOut(true);
		setTimeout(() => {
			setAnimatingOut(false);
			setDismissed(true);
		}, 220);
	}

	function openFromPill() {
		setDismissed(false);
	}

	return (
		<Portal node={document.body}>
			<div className={clsx('fixed z-[9999] pointer-events-none', posClass)}>
				<div className='pointer-events-auto'>
					{/* --- Dismissed Pill (Stripe-like) --- */}
					<div
						className={clsx(
							'transition-all duration-0 ease-out origin-bottom-right cursor-pointer',
							dismissed
								? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
								: 'opacity-0 translate-y-2 scale-[0.98] pointer-events-none',
						)}
					>
						<button
							type='button'
							onClick={openFromPill}
							className='w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl hover:border-slate-300 cursor-pointer'
						>
							<div className='flex items-center justify-between gap-3 px-4 pt-2'>
								<div className='min-w-0'>
									<div className='text-sm font-extrabold text-slate-900'>
										Setup guide
									</div>
								</div>
								<div className='grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-50'>
									<FiExternalLink className='h-4 w-4' />
								</div>
							</div>

							<div className='px-4 pb-3 pt-2'>
								<div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-100'>
									<div
										className='h-full rounded-full bg-primary transition-all duration-300 ease-out'
										style={{ width: `${percent}%` }}
									/>
								</div>

								<div className='mt-3 text-sm font-medium text-slate-500 text-start'>
									Next:{' '}
									<span className='font-semibold text-primary'>
										{nextStepLabel}
									</span>
								</div>
							</div>
						</button>
					</div>

					{/* --- Expanded Panel --- */}
					<div
						className={clsx(
							'transition-all duration-200 ease-out origin-bottom-right',
							dismissed && 'w-0 h-0',
							!dismissed && !animatingOut
								? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
								: animatingOut
									? 'opacity-0 translate-y-2 scale-[0.98] pointer-events-none'
									: 'opacity-0 translate-y-2 scale-[0.98] pointer-events-none',
						)}
					>
						<div className='w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl'>
							{/* Header */}
							<div className='flex items-center justify-between gap-3 px-4 py-3'>
								<div className='min-w-0'>
									<div className='text-sm font-extrabold text-slate-900'>
										Setup guide
									</div>
									<div className='text-xs font-semibold text-slate-500'>
										{doneCount} of {totalCount} completed
									</div>
								</div>

								<div className='flex items-center gap-1'>
									<button
										type='button'
										onClick={() => router.push(nextStepHref)}
										className='grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-50'
										aria-label='Open next step'
										title='Open next step'
									>
										<FiExternalLink className='h-5 w-5' />
									</button>

									<button
										type='button'
										onClick={dismissWithAnim}
										className='grid h-9 w-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-50'
										aria-label='Dismiss'
										title='Dismiss'
									>
										<FiX className='h-5 w-5' />
									</button>
								</div>
							</div>

							{/* Progress bar */}
							<div className='px-4 pb-3'>
								<div className='h-2 w-full overflow-hidden rounded-full bg-slate-100'>
									<div
										className='h-full rounded-full bg-primary transition-all duration-300 ease-out'
										style={{ width: `${percent}%` }}
									/>
								</div>

								<div className='mt-3 text-sm font-semibold text-slate-500'>
									Next:{' '}
									<button
										type='button'
										onClick={() => router.push(nextStepHref)}
										className='font-extrabold text-primary hover:text-primary/70 cursor-pointer'
									>
										{nextStepLabel}
									</button>
								</div>
							</div>

							{/* Content */}
							<div className='border-t border-slate-100 p-2'>
								{loading ? (
									<div className='p-3 text-sm font-semibold text-slate-500'>
										Loading…
									</div>
								) : error ? (
									<div className='p-3'>
										<div className='text-sm font-extrabold text-rose-700'>
											Couldn’t load setup status
										</div>
										<div className='mt-1 text-xs font-semibold text-slate-500'>
											{error}
										</div>
										<button
											type='button'
											onClick={fetchState}
											className='mt-3 rounded-xl bg-slate-900 px-3 py-2 text-xs font-extrabold text-white hover:bg-slate-800'
										>
											Retry
										</button>
									</div>
								) : (
									<div className='space-y-1'>
										{sections.map((section) => {
											const isOpen = !!openSections[section.id];
											const allSectionDone =
												section.steps.length > 0 &&
												section.steps.every((s) => s.done);

											return (
												<div key={section.id} className='rounded-xl'>
													<button
														type='button'
														onClick={() => toggleSection(section.id)}
														className='flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50'
													>
														<div
															className={clsx(
																'text-sm font-semibold',
																allSectionDone
																	? 'text-slate-400 line-through'
																	: 'text-slate-900',
															)}
														>
															{section.title}
														</div>

														<span className='transition-transform duration-200 ease-out'>
															{isOpen ? (
																<FiChevronUp className='h-4 w-4 text-slate-500' />
															) : (
																<FiChevronDown className='h-4 w-4 text-slate-500' />
															)}
														</span>
													</button>

													{/* Accordion animated */}
													<div
														className={clsx(
															'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
															isOpen
																? 'grid-rows-[1fr] opacity-100'
																: 'grid-rows-[0fr] opacity-0',
														)}
													>
														<div className='overflow-hidden'>
															<div className='pb-2'>
																{section.steps.map((step) => (
																	<button
																		key={step.key}
																		type='button'
																		onClick={() => !step.done && goToStep(step)}
																		className={clsx(
																			'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50 transition-colors duration-150',
																			step.done
																				? 'cursor-not-allowed'
																				: 'cursor-pointer',
																		)}
																	>
																		<div
																			className={clsx(
																				'grid h-6 w-6 place-items-center rounded-full border transition-colors duration-200',
																				step.done
																					? 'border-violet-200 bg-primary text-white'
																					: 'border-slate-200 bg-white text-transparent',
																			)}
																		>
																			<FiCheck className='h-4 w-4' />
																		</div>

																		<div
																			className={clsx(
																				'text-sm transition-colors duration-200',
																				step.done
																					? 'text-slate-400 line-through'
																					: 'text-slate-900',
																			)}
																		>
																			{step.label}
																		</div>
																	</button>
																))}
															</div>
														</div>
													</div>
												</div>
											);
										})}

										{/* Go live */}
										<div className='mt-1 rounded-xl bg-slate-50 px-3 py-2'>
											<div className='flex items-center justify-between'>
												<div className='text-sm font-extrabold text-slate-900'>
													Go live
												</div>
												<div
													className={clsx(
														'inline-flex items-center gap-2 text-xs font-extrabold',
														allDone ? 'text-emerald-700' : 'text-slate-500',
													)}
												>
													{allDone ? (
														<span>Ready</span>
													) : (
														<>
															<FiLock className='h-4 w-4' />
															<span>Locked</span>
														</>
													)}
												</div>
											</div>
											<div className='mt-1 text-xs font-semibold text-slate-500'>
												{allDone
													? 'All steps completed. You’re ready to go live.'
													: 'Complete the steps above to unlock go-live.'}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Portal>
	);
}
