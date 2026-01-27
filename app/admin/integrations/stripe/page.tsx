'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import CardShell from '@/app/components/CardShell';
import { Pill } from '@/app/components/Pill';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import {
	FiCheckCircle,
	FiClock,
	FiEye,
	FiEyeOff,
	FiRefreshCw,
	FiArrowRight,
	FiExternalLink,
	FiLink,
	FiXCircle,
} from 'react-icons/fi';

import { api } from '@/lib/api/api';
import clsx from '@/lib/clsx';

type ConnState = 'idle' | 'testing' | 'ok' | 'error';
type SaveState = 'idle' | 'saving' | 'ok' | 'error';

type StripeConfigPayload = {
	stripe_secret_key: string;
	stripe_webhook_secret: string;
	stripe_publishable_key?: string | null;
};

type StripeConfigResponse = {
	ok: boolean;
	tenant_id: number;
};

type StripeSnapshotResponse = {
	ok: boolean;
	tenant_id: number;
	configured: boolean;
	stripe_publishable_key?: string | null;
	// Optional extra fields if you later add them:
	// missing?: string[];
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

function storageKey(field: 'pk' | 'sk' | 'whsec') {
	return `stripe_config_${field}`;
}

export default function AdminStripeIntegrationPage() {
	// fields
	const [pk, setPk] = useState('');
	const [sk, setSk] = useState('');
	const [whsec, setWhsec] = useState('');

	// show/hide
	const [showSk, setShowSk] = useState(false);
	const [showWhsec, setShowWhsec] = useState(false);

	// flow state
	const [connState, setConnState] = useState<ConnState>('idle'); // validate format only
	const [saveState, setSaveState] = useState<SaveState>('idle');
	const [configured, setConfigured] = useState(false);

	const [banner, setBanner] = useState<{
		variant: 'success' | 'error' | 'info';
		title: string;
		body?: string;
	} | null>(null);

	// loading overlays
	const [snapshotLoading, setSnapshotLoading] = useState(true);

	async function refreshSnapshot() {
		setSnapshotLoading(true);
		try {
			const snap = await api<StripeSnapshotResponse>('/stripe/snapshot', {
				method: 'GET',
				cache: 'no-store',
			});

			if (snap?.ok) {
				setConfigured(!!snap.configured);

				// Optional: prefill pk from DB if empty
				if (snap.stripe_publishable_key && !pk.trim()) {
					setPk(String(snap.stripe_publishable_key));
				}

				// UX: if already configured, show a friendly state
				if (snap.configured) setConnState('ok');
			}
		} catch {
			// don't block UI; snapshot is just status
		} finally {
			setSnapshotLoading(false);
		}
	}

	useEffect(() => {
		refreshSnapshot();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// load local cache (so admin doesn't re-type keys)
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const lpk = window.localStorage.getItem(storageKey('pk')) || '';
		const lsk = window.localStorage.getItem(storageKey('sk')) || '';
		const lwh = window.localStorage.getItem(storageKey('whsec')) || '';
		if (lpk) setPk(lpk);
		if (lsk) setSk(lsk);
		if (lwh) setWhsec(lwh);
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (pk) window.localStorage.setItem(storageKey('pk'), pk);
		else window.localStorage.removeItem(storageKey('pk'));
	}, [pk]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (sk) window.localStorage.setItem(storageKey('sk'), sk);
		else window.localStorage.removeItem(storageKey('sk'));
	}, [sk]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (whsec) window.localStorage.setItem(storageKey('whsec'), whsec);
		else window.localStorage.removeItem(storageKey('whsec'));
	}, [whsec]);

	// reset states when user edits keys (don't touch `configured` – that's from backend)
	useEffect(() => {
		setConnState('idle');
		setSaveState('idle');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pk, sk, whsec]);

	const canTest = useMemo(() => {
		return sk.trim() && whsec.trim() && connState !== 'testing';
	}, [sk, whsec, connState]);

	const canSave = useMemo(() => {
		return (
			connState === 'ok' && saveState !== 'saving' && sk.trim() && whsec.trim()
		);
	}, [connState, saveState, sk, whsec]);

	function validateFormat() {
		setBanner(null);
		setConnState('testing');

		const _sk = sk.trim();
		const _wh = whsec.trim();
		const _pk = pk.trim();

		const errors: string[] = [];
		if (!_sk.startsWith('sk_'))
			errors.push('stripe_secret_key must start with "sk_".');
		if (!_wh.startsWith('whsec_'))
			errors.push('stripe_webhook_secret must start with "whsec_".');
		if (_pk && !_pk.startsWith('pk_'))
			errors.push('stripe_publishable_key must start with "pk_".');

		if (errors.length) {
			setConnState('error');
			setBanner({
				variant: 'error',
				title: 'Invalid format',
				body: errors.join('\n'),
			});
			return;
		}

		setConnState('ok');
		setBanner({
			variant: 'success',
			title: 'Looks good',
			body: 'Format validated. You can now save the connection.',
		});
	}

	async function saveConfig() {
		setBanner(null);
		setSaveState('saving');

		const payload: StripeConfigPayload = {
			stripe_secret_key: sk.trim(),
			stripe_webhook_secret: whsec.trim(),
		};
		const _pk = pk.trim();
		if (_pk) payload.stripe_publishable_key = _pk;

		try {
			const res = await api<StripeConfigResponse>('/stripe/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				cache: 'no-store',
			});

			if (res?.ok) {
				setBanner({
					variant: 'success',
					title: 'Stripe configured',
					body: 'Saved successfully. Next: add the webhook endpoint in Stripe and point it to /webhooks/stripe.',
				});
				await refreshSnapshot(); // ✅ persists status across refresh
			} else {
				setBanner({
					variant: 'error',
					title: 'Save failed',
					body: 'Unexpected response from server.',
				});
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			setBanner({
				variant: 'error',
				title: 'Save failed',
				body: e?.message ?? 'Could not save Stripe config.',
			});
		} finally {
			setSaveState('idle');
		}
	}

	const webhookEndpoint =
		typeof window !== 'undefined' && process.env.NEXT_PUBLIC_BACKEND_URL
			? `${process.env.NEXT_PUBLIC_BACKEND_URL}/webhooks/stripe`
			: `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/webhooks/stripe`;

	return (
		<>
			<LoadingOverlay
				show={snapshotLoading || saveState === 'saving'}
				title={saveState === 'saving' ? 'Saving Stripe config…' : 'Loading…'}
				message={
					saveState === 'saving'
						? 'Persisting keys to your tenant.'
						: 'Fetching current Stripe configuration.'
				}
			/>

			<main className='mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8'>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
					<div>
						<h1 className='text-2xl font-extrabold tracking-tight'>
							Stripe Integration
						</h1>
						<p className='mt-1 text-sm font-medium text-slate-500'>
							Add keys → validate → save.
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
						<CardShell
							title='Setup'
							subtitle='Your backend saves these values into tenants.stripe_*'
						>
							{/* status */}
							<div className='flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3'>
								<div className='min-w-0'>
									<div className='text-[11px] font-extrabold tracking-wider text-slate-500'>
										STATUS
									</div>
									<div className='mt-1 text-sm font-extrabold text-slate-900'>
										{configured ? 'Configured' : 'Not configured'}
									</div>
								</div>

								{configured ? (
									<Pill variant='green'>
										<FiCheckCircle className='h-3.5 w-3.5' />
										Configured
									</Pill>
								) : (
									<Pill variant='slate'>
										<FiClock className='h-3.5 w-3.5' />
										Setup
									</Pill>
								)}
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
							</div>

							{/* inputs */}
							<div className='mt-6'>
								<div className='text-[11px] font-extrabold tracking-wider text-slate-500'>
									PUBLISHABLE KEY (OPTIONAL)
								</div>
								<div className='mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
									<input
										value={pk}
										onChange={(e) => setPk(e.target.value)}
										className='w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400'
										placeholder='pk_test_...'
									/>
								</div>

								<div className='mt-6 text-[11px] font-extrabold tracking-wider text-slate-500'>
									SECRET KEY
								</div>
								<div className='mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
									<input
										type={showSk ? 'text' : 'password'}
										value={sk}
										onChange={(e) => setSk(e.target.value)}
										className='w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400'
										placeholder='sk_test_...'
									/>
									<button
										onClick={() => setShowSk((p) => !p)}
										className='rounded-xl p-2 text-slate-500 hover:bg-slate-50'
										aria-label={showSk ? 'Hide secret key' : 'Show secret key'}
										type='button'
									>
										{showSk ? <FiEyeOff /> : <FiEye />}
									</button>
								</div>

								<div className='mt-6 text-[11px] font-extrabold tracking-wider text-slate-500'>
									WEBHOOK SECRET
								</div>
								<div className='mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
									<input
										type={showWhsec ? 'text' : 'password'}
										value={whsec}
										onChange={(e) => setWhsec(e.target.value)}
										className='w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400'
										placeholder='whsec_...'
									/>
									<button
										onClick={() => setShowWhsec((p) => !p)}
										className='rounded-xl p-2 text-slate-500 hover:bg-slate-50'
										aria-label={
											showWhsec ? 'Hide webhook secret' : 'Show webhook secret'
										}
										type='button'
									>
										{showWhsec ? <FiEyeOff /> : <FiEye />}
									</button>
								</div>

								{/* actions */}
								<div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center'>
									<button
										onClick={validateFormat}
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
										Validate keys
									</button>

									<button
										onClick={saveConfig}
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
								</div>

								<div className='mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
									<div className='flex items-center justify-between gap-3'>
										<div className='min-w-0'>
											<div className='text-[11px] font-extrabold tracking-wider text-slate-500'>
												WEBHOOK ENDPOINT
											</div>
											<div className='mt-1 text-sm font-extrabold text-slate-900'>
												{webhookEndpoint}
											</div>
											<div className='mt-1 text-xs font-semibold text-slate-600'>
												Add this endpoint in Stripe → Developers → Webhooks.
											</div>
										</div>

										{connState === 'ok' ? (
											<FiCheckCircle className='text-emerald-600' />
										) : connState === 'error' ? (
											<FiXCircle className='text-rose-600' />
										) : null}
									</div>
								</div>
							</div>
						</CardShell>
					</div>

					{/* RIGHT */}
					<div className='space-y-6 w-full lg:w-[360px]'>
						<div className='rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white shadow-sm'>
							<div className='flex items-center gap-2 text-white/90'>
								<FiLink />
								<div className='text-sm font-extrabold'>Need help?</div>
							</div>

							<ul className='mt-2 space-y-2 text-sm font-medium text-white/90 list-disc pl-8'>
								<li>Grab your API keys</li>
								<li>Validate</li>
								<li>Save</li>
								<li>
									Configure webhook pointing to <b>{webhookEndpoint}</b>
								</li>
							</ul>

							<a
								href='https://dashboard.stripe.com/apikeys'
								target='_blank'
								rel='noreferrer'
								className='mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-white/20'
							>
								Open Stripe API keys
								<FiExternalLink />
							</a>

							<a
								href='https://dashboard.stripe.com/webhooks'
								target='_blank'
								rel='noreferrer'
								className='mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-white/20'
							>
								Open Stripe Webhooks
								<FiExternalLink />
							</a>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
