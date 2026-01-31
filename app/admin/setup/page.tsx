'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FiArrowRight } from 'react-icons/fi';

import CardShell from '@/app/components/CardShell';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import clsx from '@/lib/clsx';
import { api } from '@/lib/api/api';

type OnboardingStepKey =
	| 'connect-moodle'
	| 'sync-moodle'
	| 'connect-stripe'
	| 'test-purchase';

type WizardStep = {
	id: number;
	key: OnboardingStepKey;
	title: string;
	description: string;
	href: string;
	status: 'not_started' | 'completed' | 'in_progress';
};

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

type ApiError = { message?: string };

function StatusPill({ status }: { status: WizardStep['status'] }) {
	if (status === 'completed') {
		return (
			<span className='inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700'>
				Completed
			</span>
		);
	}
	if (status === 'in_progress') {
		return (
			<span className='inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700'>
				In Progress
			</span>
		);
	}
	return (
		<span className='inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-700'>
			Not Started
		</span>
	);
}

function StepRow({ step }: { step: WizardStep }) {
	return (
		<Link
			href={step.href}
			className='group block rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300'
		>
			<div className='flex items-center gap-4 p-4 sm:p-5'>
				<div
					className={clsx(
						'grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-extrabold',
						step.status === 'completed' && 'bg-emerald-100 text-emerald-700',
						step.status === 'in_progress' && 'bg-amber-100 text-amber-700',
						step.status === 'not_started' && 'bg-slate-100 text-slate-700',
					)}
				>
					{step.id}
				</div>

				<div className='min-w-0 flex-1'>
					<div className='flex flex-wrap items-center justify-between gap-3'>
						<div className='text-sm font-extrabold text-slate-900'>
							{step.title}
						</div>
						<StatusPill status={step.status} />
					</div>

					<div className='mt-1 text-sm font-medium text-slate-500'>
						{step.description}
					</div>
				</div>

				<div className='ml-1 hidden h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-500 group-hover:bg-slate-100 sm:grid'>
					<FiArrowRight className='h-4 w-4' />
				</div>
			</div>
		</Link>
	);
}

function ProgressCard({
	completed,
	total,
	nextHref,
}: {
	completed: number;
	total: number;
	nextHref: string;
}) {
	const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

	return (
		<div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6'>
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div className='min-w-0'>
					<div className='text-sm font-extrabold text-slate-900'>
						{completed} of {total} steps completed
					</div>

					<div className='mt-2 h-2 w-full max-w-[640px] overflow-hidden rounded-full bg-slate-100'>
						<div
							className='h-full rounded-full bg-blue-600 transition-all'
							style={{ width: `${pct}%` }}
						/>
					</div>
				</div>

				<div className='flex items-center justify-between gap-4 sm:justify-end'>
					<div className='text-sm font-extrabold text-slate-500'>{pct}%</div>
					<Link
						href={nextHref}
						className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700'
					>
						Continue setup <FiArrowRight className='h-4 w-4' />
					</Link>
				</div>
			</div>
		</div>
	);
}

function SystemStatus({
	stepsByKey,
}: {
	stepsByKey: Record<OnboardingStepKey, OnboardingStepItem | undefined>;
}) {
	const stripeDone = !!stepsByKey['connect-stripe']?.done;
	const moodleDone = !!stepsByKey['connect-moodle']?.done;

	return (
		<CardShell title='SYSTEM STATUS'>
			<div className='space-y-4'>
				<div className='flex items-center justify-between'>
					<div>
						<div className='text-sm font-extrabold text-slate-900'>Stripe</div>
						<div className='text-xs font-semibold text-slate-500'>Payments</div>
					</div>
					<span
						className={clsx(
							'text-sm font-extrabold',
							stripeDone ? 'text-emerald-600' : 'text-blue-600',
						)}
					>
						{stripeDone ? 'Connected' : 'Connect'}
					</span>
				</div>

				<div className='flex items-center justify-between'>
					<div>
						<div className='text-sm font-extrabold text-slate-900'>Moodle</div>
						<div className='text-xs font-semibold text-slate-500'>LMS Sync</div>
					</div>
					<span
						className={clsx(
							'text-sm font-extrabold',
							moodleDone ? 'text-emerald-600' : 'text-blue-600',
						)}
					>
						{moodleDone ? 'Connected' : 'Connect'}
					</span>
				</div>

				<div className='flex items-center justify-between'>
					<div>
						<div className='text-sm font-extrabold text-slate-900'>API</div>
						<div className='text-xs font-semibold text-slate-500'>
							Operational
						</div>
					</div>
					<span className='text-sm font-extrabold text-emerald-600'>Live</span>
				</div>

				<div className='rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500'>
					Complete the setup wizard to activate your integrations automatically.
				</div>
			</div>
		</CardShell>
	);
}

export default function AdminSetupWizardPage() {
	const baseSteps = useMemo(
		() =>
			[
				{
					id: 1,
					key: 'connect-moodle',
					title: 'Connect Moodle',
					description: 'Link your LMS to sync courses and enrollments.',
					href: '/admin/setup/connect-moodle',
				},
				{
					id: 2,
					key: 'sync-moodle',
					title: 'Sync your LMS',
					description: 'Sync your LMS courses to auto-enroll students.',
					href: '/admin/setup/sync-moodle',
				},
				{
					id: 3,
					key: 'connect-stripe',
					title: 'Connect Stripe',
					description: 'Connect Stripe to accept payments securely.',
					href: '/admin/setup/connect-stripe',
				},
				{
					id: 4,
					key: 'test-purchase',
					title: 'Test product purchase',
					description: 'Final check before going live to students.',
					href: '/admin/setup/test-purchase',
				},
			] as const,
		[],
	);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [onboarding, setOnboarding] = useState<OnboardingStateResponse | null>(
		null,
	);

	async function loadOnboarding() {
		setLoading(true);
		setError(null);

		try {
			const res = await api<OnboardingStateResponse>('/onboarding/state', {
				method: 'GET',
				cache: 'no-store',
			});

			if (!res?.ok) {
				setError('Onboarding state returned ok=false.');
				setOnboarding(null);
				return;
			}

			// Debug (keep while verifying)
			console.log('[onboarding/state]', res);

			setOnboarding(res);
		} catch (e: unknown) {
			const err = e as ApiError;
			setError(err?.message ?? 'Failed to load onboarding state.');
			setOnboarding(null);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadOnboarding();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const stepsByKey = useMemo(() => {
		const map: Record<OnboardingStepKey, OnboardingStepItem | undefined> = {
			'connect-moodle': undefined,
			'sync-moodle': undefined,
			'connect-stripe': undefined,
			'test-purchase': undefined,
		};
		for (const s of onboarding?.steps || []) map[s.key] = s;
		return map;
	}, [onboarding]);

	const currentKey: OnboardingStepKey | null =
		(onboarding?.current_step?.key as OnboardingStepKey) || null;

	const steps: WizardStep[] = useMemo(() => {
		return baseSteps.map((b) => {
			const serverStep = stepsByKey[b.key];

			let status: WizardStep['status'] = 'not_started';
			if (serverStep?.done) status = 'completed';
			else if (currentKey && b.key === currentKey) status = 'in_progress';

			return { ...b, status };
		});
	}, [baseSteps, stepsByKey, currentKey]);

	const completed =
		onboarding?.progress?.done ??
		steps.filter((s) => s.status === 'completed').length;

	const total = onboarding?.progress?.total ?? steps.length;

	const nextStep = steps.find((s) => s.status !== 'completed') ?? steps[0];

	return (
		<main className='mx-auto max-w-[1200px] px-4 py-8 md:px-6'>
			<LoadingOverlay
				show={loading}
				title='Loading setup…'
				message='Fetching onboarding status for your tenant.'
			/>

			{/* Header */}
			<div>
				<h1 className='text-4xl font-extrabold tracking-tight text-slate-900'>
					Let&apos;s get your school running.
				</h1>
				<p className='mt-2 text-base font-medium text-slate-500'>
					Complete these steps to launch your first course.
				</p>

				{/* Optional debug line - remove later */}
				{onboarding?.ok ? (
					<div className='mt-2 text-xs font-semibold text-slate-500'>
						Tenant:{' '}
						<span className='font-mono font-bold'>{onboarding.tenant_id}</span>{' '}
						• Progress:{' '}
						<span className='font-mono font-bold'>
							{onboarding.progress.percent}%
						</span>{' '}
						• Current:{' '}
						<span className='font-mono font-bold'>
							{onboarding.current_step.key}
						</span>
					</div>
				) : null}

				{error ? (
					<div className='mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700'>
						{error}
					</div>
				) : null}
			</div>

			{/* Progress */}
			<div className='mt-6'>
				<ProgressCard
					completed={completed}
					total={total}
					nextHref={nextStep.href}
				/>
			</div>

			{/* Two-column layout */}
			<div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12'>
				<div className='space-y-4 lg:col-span-8'>
					{steps.map((s) => (
						<StepRow key={s.key} step={s} />
					))}
				</div>

				<div className='lg:col-span-4'>
					<SystemStatus stepsByKey={stepsByKey} />
				</div>
			</div>
		</main>
	);
}
