// 'use client';

// import Link from 'next/link';
// import { useEffect, useMemo, useState } from 'react';
// import {
// 	FiCopy,
// 	FiAlertTriangle,
// 	FiCheckCircle,
// 	FiXCircle,
// } from 'react-icons/fi';
// import { IoKeySharp } from 'react-icons/io5';

// import CardShell from '@/app/components/CardShell';
// import TextInputField from '@/app/components/TextInputField';
// import LoadingOverlay from '@/app/components/LoadingOverlay';
// import WizardStepper from '@/app/components/WizardStepper';
// import clsx from '@/lib/clsx';
// import { api } from '@/lib/api/api';
// import { toast } from 'sonner';

// type ConnState = 'idle' | 'testing' | 'ok' | 'error';
// type SaveState = 'idle' | 'saving' | 'ok' | 'error';

// type StripeConfigPayload = {
// 	stripe_secret_key: string;
// 	stripe_webhook_secret: string;
// 	stripe_publishable_key?: string | null;
// };

// type StripeConfigResponse = {
// 	ok: boolean;
// 	tenant_id: number;
// };

// type StripeSnapshotResponse = {
// 	ok: boolean;
// 	tenant_id: number;
// 	configured: boolean;
// 	stripe_publishable_key?: string | null;
// };

// type StripeTestKeysPayload = {
// 	stripe_secret_key?: string | null;
// };

// type StripeTestKeysResponse = {
// 	ok: boolean;
// 	message: string;
// 	tenant_id: number;
// 	account_id?: string;
// 	country?: string;
// 	charges_enabled?: boolean;
// 	details_submitted?: boolean;
// 	livemode?: boolean;
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

// function storageKey(field: 'pk' | 'sk' | 'whsec') {
// 	return `stripe_config_${field}`;
// }

// export default function ConnectStripeWizardPage() {
// 	const step = 3;
// 	const total = 4;

// 	// fields
// 	const [publishableKey, setPublishableKey] = useState('');
// 	const [secretKey, setSecretKey] = useState('');
// 	const [webhookSecret, setWebhookSecret] = useState('');

// 	// flow state
// 	const [configured, setConfigured] = useState(false);
// 	const [connState, setConnState] = useState<ConnState>('idle');
// 	const [saveState, setSaveState] = useState<SaveState>('idle');

// 	const [banner, setBanner] = useState<{
// 		variant: 'success' | 'error' | 'info';
// 		title: string;
// 		body?: string;
// 	} | null>(null);

// 	const [snapshotLoading, setSnapshotLoading] = useState(true);

// 	const endpointUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/webhooks/stripe`;

// 	const webhookMissing =
// 		!webhookSecret ||
// 		webhookSecret.trim() === '' ||
// 		webhookSecret === 'whsec_...';

// 	// Load local cache (so admin doesn't re-type keys)
// 	useEffect(() => {
// 		if (typeof window === 'undefined') return;
// 		const lpk = window.localStorage.getItem(storageKey('pk')) || '';
// 		const lsk = window.localStorage.getItem(storageKey('sk')) || '';
// 		const lwh = window.localStorage.getItem(storageKey('whsec')) || '';
// 		if (lpk) setPublishableKey(lpk);
// 		if (lsk) setSecretKey(lsk);
// 		if (lwh) setWebhookSecret(lwh);
// 	}, []);

// 	// Persist to local cache
// 	useEffect(() => {
// 		if (typeof window === 'undefined') return;
// 		if (publishableKey)
// 			window.localStorage.setItem(storageKey('pk'), publishableKey);
// 		else window.localStorage.removeItem(storageKey('pk'));
// 	}, [publishableKey]);

// 	useEffect(() => {
// 		if (typeof window === 'undefined') return;
// 		if (secretKey) window.localStorage.setItem(storageKey('sk'), secretKey);
// 		else window.localStorage.removeItem(storageKey('sk'));
// 	}, [secretKey]);

// 	useEffect(() => {
// 		if (typeof window === 'undefined') return;
// 		if (webhookSecret)
// 			window.localStorage.setItem(storageKey('whsec'), webhookSecret);
// 		else window.localStorage.removeItem(storageKey('whsec'));
// 	}, [webhookSecret]);

// 	async function refreshSnapshot() {
// 		setSnapshotLoading(true);
// 		try {
// 			const snap = await api<StripeSnapshotResponse>('/stripe/snapshot', {
// 				method: 'GET',
// 				cache: 'no-store',
// 			});

// 			if (snap?.ok) {
// 				setConfigured(!!snap.configured);

// 				// Prefill publishable key if backend has it and user hasn't typed
// 				if (snap.stripe_publishable_key && !publishableKey.trim()) {
// 					setPublishableKey(String(snap.stripe_publishable_key));
// 				}

// 				// If already configured, user can proceed without re-testing
// 				if (snap.configured) setConnState('ok');
// 			}
// 		} catch {
// 			// snapshot is status only; don't block UI
// 		} finally {
// 			setSnapshotLoading(false);
// 		}
// 	}

// 	useEffect(() => {
// 		refreshSnapshot();
// 		// eslint-disable-next-line react-hooks/exhaustive-deps
// 	}, []);

// 	// Reset states when user edits keys
// 	useEffect(() => {
// 		setConnState('idle');
// 		setSaveState('idle');
// 		setBanner(null);
// 		// eslint-disable-next-line react-hooks/exhaustive-deps
// 	}, [publishableKey, secretKey, webhookSecret]);

// 	const canTest = useMemo(() => {
// 		return (
// 			secretKey.trim() &&
// 			webhookSecret.trim() &&
// 			connState !== 'testing' &&
// 			saveState !== 'saving'
// 		);
// 	}, [secretKey, webhookSecret, connState, saveState]);

// 	const canSave = useMemo(() => {
// 		return (
// 			connState === 'ok' &&
// 			saveState !== 'saving' &&
// 			secretKey.trim() &&
// 			webhookSecret.trim()
// 		);
// 	}, [connState, saveState, secretKey, webhookSecret]);

// 	function onCopyEndpoint() {
// 		if (typeof navigator !== 'undefined' && navigator.clipboard) {
// 			navigator.clipboard.writeText(endpointUrl);
// 			toast.success('Copied webhook endpoint to clipboard.');
// 		}
// 	}

// 	// ✅ NEW: Real end-to-end validation via backend -> Stripe API
// 	async function testKeys() {
// 		setBanner(null);
// 		setConnState('testing');

// 		// Fast UX guard (optional, but nice)
// 		const _sk = secretKey.trim();
// 		const _wh = webhookSecret.trim();
// 		const _pk = publishableKey.trim();

// 		const errors: string[] = [];
// 		if (!_sk.startsWith('sk_'))
// 			errors.push('Secret Key must start with "sk_".');
// 		if (!_wh.startsWith('whsec_'))
// 			errors.push('Webhook Secret must start with "whsec_".');
// 		if (_pk && !_pk.startsWith('pk_'))
// 			errors.push('Publishable Key must start with "pk_".');

// 		if (errors.length) {
// 			setConnState('error');
// 			setBanner({
// 				variant: 'error',
// 				title: 'Invalid format',
// 				body: errors.join('\n'),
// 			});
// 			return;
// 		}

// 		try {
// 			const payload: StripeTestKeysPayload = { stripe_secret_key: _sk };

// 			const res = await api<StripeTestKeysResponse>('/stripe/test-keys', {
// 				method: 'POST',
// 				headers: { 'Content-Type': 'application/json' },
// 				body: JSON.stringify(payload),
// 				cache: 'no-store',
// 			});

// 			if (res?.ok) {
// 				setConnState('ok');

// 				const lines: string[] = [];
// 				if (res.account_id) lines.push(`Account: ${res.account_id}`);
// 				if (typeof res.livemode === 'boolean')
// 					lines.push(`Mode: ${res.livemode ? 'LIVE' : 'TEST'}`);
// 				if (res.country) lines.push(`Country: ${res.country}`);

// 				setBanner({
// 					variant: 'success',
// 					title: res.message || 'Keys are valid',
// 					body: lines.length ? lines.join('\n') : undefined,
// 				});

// 				toast.success('Stripe key validated with Stripe');
// 			} else {
// 				setConnState('error');
// 				setBanner({
// 					variant: 'error',
// 					title: 'Key test failed',
// 					body: res?.message || 'Could not validate the key with Stripe.',
// 				});
// 			}
// 		} catch (e: unknown) {
// 			const err = e as ApiError;
// 			setConnState('error');
// 			setBanner({
// 				variant: 'error',
// 				title: 'Key test failed',
// 				body: err?.message ?? 'Could not validate the key with Stripe.',
// 			});
// 		}
// 	}

// 	async function saveConfigAndContinue() {
// 		setBanner(null);
// 		setSaveState('saving');

// 		const payload: StripeConfigPayload = {
// 			stripe_secret_key: secretKey.trim(),
// 			stripe_webhook_secret: webhookSecret.trim(),
// 		};

// 		const pk = publishableKey.trim();
// 		if (pk) payload.stripe_publishable_key = pk;

// 		try {
// 			const res = await api<StripeConfigResponse>('/stripe/config', {
// 				method: 'POST',
// 				headers: { 'Content-Type': 'application/json' },
// 				body: JSON.stringify(payload),
// 				cache: 'no-store',
// 			});

// 			if (res?.ok) {
// 				setSaveState('ok');
// 				setBanner({
// 					variant: 'success',
// 					title: 'Stripe configured ✅',
// 					body: `Saved successfully.\nNext: ensure Stripe webhook points to:\n${endpointUrl}`,
// 				});
// 				await refreshSnapshot();

// 				setTimeout(() => {
// 					window.location.href = '/admin/setup/test-purchase';
// 				}, 800);
// 			} else {
// 				setSaveState('error');
// 				setBanner({
// 					variant: 'error',
// 					title: 'Save failed',
// 					body: 'Unexpected response from server.',
// 				});
// 			}
// 		} catch (e: unknown) {
// 			const err = e as ApiError;
// 			setSaveState('error');
// 			setBanner({
// 				variant: 'error',
// 				title: 'Save failed',
// 				body: err?.message ?? 'Could not save Stripe config.',
// 			});
// 		} finally {
// 			setTimeout(() => setSaveState('idle'), 400);
// 		}
// 	}

// 	return (
// 		<main className='mx-auto max-w-[760px] px-4 py-10 md:px-6'>
// 			<LoadingOverlay
// 				show={
// 					snapshotLoading || connState === 'testing' || saveState === 'saving'
// 				}
// 				title={
// 					connState === 'testing'
// 						? 'Testing keys…'
// 						: saveState === 'saving'
// 							? 'Saving Stripe config…'
// 							: 'Loading…'
// 				}
// 				message={
// 					connState === 'testing'
// 						? 'Validating your Stripe credentials with Stripe.'
// 						: saveState === 'saving'
// 							? 'Persisting Stripe keys to your tenant.'
// 							: 'Fetching current Stripe configuration.'
// 				}
// 			/>

// 			<WizardStepper step={step} total={total} rightText='STRIPE INTEGRATION' />

// 			{/* Header */}
// 			<div className='mt-8'>
// 				<h1 className='text-4xl font-extrabold tracking-tight text-slate-900'>
// 					Connect your Stripe Account
// 				</h1>
// 				<p className='mt-2 text-base font-medium text-slate-500'>
// 					Enter your API keys to start accepting subscription payments
// 					immediately.
// 				</p>

// 				<div className='mt-4 flex items-center gap-2'>
// 					{configured ? (
// 						<span className='inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700'>
// 							<FiCheckCircle className='h-4 w-4' />
// 							Configured
// 						</span>
// 					) : (
// 						<span className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-600'>
// 							<FiXCircle className='h-4 w-4' />
// 							Not configured
// 						</span>
// 					)}
// 				</div>
// 			</div>

// 			{/* banner */}
// 			<div className='mt-6 space-y-3'>
// 				{banner ? (
// 					<Banner
// 						variant={banner.variant}
// 						title={banner.title}
// 						body={banner.body}
// 						onClose={() => setBanner(null)}
// 					/>
// 				) : null}
// 			</div>

// 			{/* Main card */}
// 			<div className='mt-8'>
// 				<CardShell title='' subtitle='' right={null}>
// 					<div className='space-y-7'>
// 						<TextInputField
// 							label='Publishable Key'
// 							value={publishableKey}
// 							onChange={setPublishableKey}
// 							placeholder='pk_live_...'
// 							hint='Find it in Stripe Dashboard → Developers → API keys.'
// 						/>

// 						<div>
// 							<div className='flex items-end justify-between gap-3'>
// 								<div className='text-xs font-bold text-slate-700'>
// 									Secret Key
// 								</div>

// 								<a
// 									href='https://dashboard.stripe.com/apikeys'
// 									target='_blank'
// 									rel='noreferrer'
// 									className='text-xs font-extrabold text-blue-600 hover:text-blue-700'
// 								>
// 									Where do I find this?
// 								</a>
// 							</div>

// 							<div className='mt-2'>
// 								<TextInputField
// 									label={''}
// 									value={secretKey}
// 									onChange={setSecretKey}
// 									placeholder='sk_live_...'
// 									type='password'
// 									autoComplete='off'
// 									required
// 								/>
// 							</div>
// 						</div>

// 						{/* Webhook configuration inner panel */}
// 						<div className='rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6'>
// 							<div className='text-lg font-extrabold text-slate-900'>
// 								Webhook Configuration
// 							</div>
// 							<p className='mt-1 text-sm font-semibold text-slate-500'>
// 								Add this endpoint to your Stripe Dashboard &gt; Developers &gt;
// 								Webhooks.
// 							</p>

// 							{/* Endpoint URL */}
// 							<div className='mt-6'>
// 								<div className='text-xs font-extrabold tracking-widest text-slate-400'>
// 									ENDPOINT URL
// 								</div>

// 								<div className='mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
// 									<div className='grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600'>
// 										<span className='text-base font-black'>⛓</span>
// 									</div>

// 									<div className='min-w-0 flex-1 truncate font-mono text-sm font-bold text-slate-700'>
// 										{endpointUrl}
// 									</div>

// 									<button
// 										type='button'
// 										onClick={onCopyEndpoint}
// 										className='grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100'
// 										aria-label='Copy endpoint URL'
// 										title='Copy'
// 									>
// 										<FiCopy className='h-5 w-5' />
// 									</button>
// 								</div>
// 							</div>

// 							{/* Webhook secret */}
// 							<div className='mt-6'>
// 								<TextInputField
// 									label='Webhook Secret'
// 									value={webhookSecret}
// 									onChange={setWebhookSecret}
// 									placeholder='whsec_...'
// 									hint='After creating the webhook, reveal and paste the signing secret.'
// 									required
// 								/>
// 							</div>

// 							{/* Warning */}
// 							{webhookMissing && (
// 								<div className='mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4'>
// 									<div className='flex items-start gap-3'>
// 										<div className='mt-0.5 text-amber-700'>
// 											<FiAlertTriangle className='h-5 w-5' />
// 										</div>
// 										<div className='min-w-0'>
// 											<div className='text-sm font-extrabold text-amber-900'>
// 												Webhook Secret Required
// 											</div>
// 											<div className='mt-1 text-sm font-semibold leading-6 text-amber-800'>
// 												You must configure the webhook secret, or subscription
// 												updates (like cancellations) will not sync with
// 												Enrollait.
// 											</div>
// 										</div>
// 									</div>
// 								</div>
// 							)}
// 						</div>

// 						{/* Footer row inside card */}
// 						<div className='flex flex-col items-stretch justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center'>
// 							<Link
// 								href='/admin/setup/test-purchase'
// 								className='text-sm font-extrabold text-slate-500 hover:text-slate-700'
// 							>
// 								Skip for now
// 							</Link>

// 							<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
// 								<button
// 									type='button'
// 									onClick={testKeys}
// 									disabled={!canTest}
// 									className={clsx(
// 										'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50',
// 										!canTest && 'cursor-not-allowed opacity-60',
// 									)}
// 								>
// 									<IoKeySharp className='h-4 w-4' />
// 									{connState === 'testing' ? 'Testing…' : 'Test Keys'}
// 								</button>

// 								<button
// 									type='button'
// 									onClick={saveConfigAndContinue}
// 									disabled={!canSave}
// 									className={clsx(
// 										'inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700',
// 										!canSave &&
// 											'cursor-not-allowed bg-slate-300 hover:bg-slate-300',
// 									)}
// 								>
// 									Save &amp; Continue
// 								</button>
// 							</div>
// 						</div>
// 					</div>
// 				</CardShell>
// 			</div>
// 		</main>
// 	);
// }

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
	FiCopy,
	FiAlertTriangle,
	FiCheckCircle,
	FiXCircle,
} from 'react-icons/fi';
import { IoKeySharp } from 'react-icons/io5';

import CardShell from '@/app/components/CardShell';
import TextInputField from '@/app/components/TextInputField';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import WizardStepper from '@/app/components/WizardStepper';
import clsx from '@/lib/clsx';
import { api } from '@/lib/api/api';
import { toast } from 'sonner';

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
};

type StripeTestKeysPayload = {
	stripe_secret_key?: string | null;
};

type StripeTestKeysResponse = {
	ok: boolean;
	message: string;
	tenant_id: number;
	account_id?: string;
	country?: string;
	charges_enabled?: boolean;
	details_submitted?: boolean;
	livemode?: boolean;
};

type ApiError = { message?: string };

/** -----------------------------
 * Onboarding types
 * ----------------------------- */
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

function stepDone(steps: OnboardingStepItem[] | null, step: OnboardingStepKey) {
	if (!steps?.length) return false;
	return steps.some((s) => s.step === step && !!s.done);
}

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

export default function ConnectStripeWizardPage() {
	const step = 3;
	const total = 4;

	// fields
	const [publishableKey, setPublishableKey] = useState('');
	const [secretKey, setSecretKey] = useState('');
	const [webhookSecret, setWebhookSecret] = useState('');

	// flow state
	const [configured, setConfigured] = useState(false);
	const [connState, setConnState] = useState<ConnState>('idle');
	const [saveState, setSaveState] = useState<SaveState>('idle');

	// onboarding
	const [onboarding, setOnboarding] = useState<OnboardingStateResponse | null>(
		null,
	);
	const [onboardingLoading, setOnboardingLoading] = useState(true);

	const [banner, setBanner] = useState<{
		variant: 'success' | 'error' | 'info';
		title: string;
		body?: string;
	} | null>(null);

	const [snapshotLoading, setSnapshotLoading] = useState(true);

	const endpointUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/webhooks/stripe`;

	const webhookMissing =
		!webhookSecret ||
		webhookSecret.trim() === '' ||
		webhookSecret === 'whsec_...';

	const connectStripeDone = stepDone(
		onboarding?.steps ?? null,
		'connect-stripe',
	);

	// -----------------------------
	// Load onboarding state
	// -----------------------------
	async function refreshOnboarding() {
		setOnboardingLoading(true);
		try {
			const state = await api<OnboardingStateResponse>('/onboarding/state', {
				method: 'GET',
				cache: 'no-store',
			});
			if (state?.ok) setOnboarding(state);
		} catch (e: unknown) {
			const err = e as ApiError;
			console.error(err?.message ?? e);
		} finally {
			setOnboardingLoading(false);
		}
	}

	async function markConnectStripeDone(meta?: Record<string, unknown>) {
		try {
			const payload: OnboardingStepPayload = {
				step: 'connect-stripe',
				done: true,
				meta: meta ?? { source: 'connect-stripe-wizard' },
			};

			await api<OnboardingStepResponse>('/onboarding/step', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				cache: 'no-store',
			});

			await refreshOnboarding();
		} catch (e: unknown) {
			const err = e as ApiError;
			console.error(err?.message ?? e);
		}
	}

	// -----------------------------
	// Load local cache (so admin doesn't re-type keys)
	// -----------------------------
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const lpk = window.localStorage.getItem(storageKey('pk')) || '';
		const lsk = window.localStorage.getItem(storageKey('sk')) || '';
		const lwh = window.localStorage.getItem(storageKey('whsec')) || '';
		if (lpk) setPublishableKey(lpk);
		if (lsk) setSecretKey(lsk);
		if (lwh) setWebhookSecret(lwh);
	}, []);

	// Persist to local cache
	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (publishableKey)
			window.localStorage.setItem(storageKey('pk'), publishableKey);
		else window.localStorage.removeItem(storageKey('pk'));
	}, [publishableKey]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (secretKey) window.localStorage.setItem(storageKey('sk'), secretKey);
		else window.localStorage.removeItem(storageKey('sk'));
	}, [secretKey]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (webhookSecret)
			window.localStorage.setItem(storageKey('whsec'), webhookSecret);
		else window.localStorage.removeItem(storageKey('whsec'));
	}, [webhookSecret]);

	// -----------------------------
	// Snapshot
	// -----------------------------
	async function refreshSnapshot() {
		setSnapshotLoading(true);
		try {
			const snap = await api<StripeSnapshotResponse>('/stripe/snapshot', {
				method: 'GET',
				cache: 'no-store',
			});

			if (snap?.ok) {
				setConfigured(!!snap.configured);

				// Prefill publishable key if backend has it and user hasn't typed
				if (snap.stripe_publishable_key && !publishableKey.trim()) {
					setPublishableKey(String(snap.stripe_publishable_key));
				}

				// If already configured, user can proceed without re-testing
				if (snap.configured) setConnState('ok');
			}
		} catch {
			// snapshot is status only; don't block UI
		} finally {
			setSnapshotLoading(false);
		}
	}

	useEffect(() => {
		refreshSnapshot();
		refreshOnboarding();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Reset states when user edits keys
	useEffect(() => {
		setConnState('idle');
		setSaveState('idle');
		setBanner(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [publishableKey, secretKey, webhookSecret]);

	const canTest = useMemo(() => {
		return (
			secretKey.trim() &&
			webhookSecret.trim() &&
			connState !== 'testing' &&
			saveState !== 'saving'
		);
	}, [secretKey, webhookSecret, connState, saveState]);

	const canSave = useMemo(() => {
		// if already "done" in onboarding + stripe is configured, allow continue
		if (connectStripeDone && configured && saveState !== 'saving') return true;

		return (
			connState === 'ok' &&
			saveState !== 'saving' &&
			secretKey.trim() &&
			webhookSecret.trim()
		);
	}, [
		connState,
		saveState,
		secretKey,
		webhookSecret,
		connectStripeDone,
		configured,
	]);

	function onCopyEndpoint() {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(endpointUrl);
			toast.success('Copied webhook endpoint to clipboard.');
		}
	}

	// ✅ Real end-to-end validation via backend -> Stripe API
	async function testKeys() {
		setBanner(null);
		setConnState('testing');

		const _sk = secretKey.trim();
		const _wh = webhookSecret.trim();
		const _pk = publishableKey.trim();

		const errors: string[] = [];
		if (!_sk.startsWith('sk_'))
			errors.push('Secret Key must start with "sk_".');
		if (!_wh.startsWith('whsec_'))
			errors.push('Webhook Secret must start with "whsec_".');
		if (_pk && !_pk.startsWith('pk_'))
			errors.push('Publishable Key must start with "pk_".');

		if (errors.length) {
			setConnState('error');
			setBanner({
				variant: 'error',
				title: 'Invalid format',
				body: errors.join('\n'),
			});
			return;
		}

		try {
			const payload: StripeTestKeysPayload = { stripe_secret_key: _sk };

			const res = await api<StripeTestKeysResponse>('/stripe/test-keys', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				cache: 'no-store',
			});

			if (res?.ok) {
				setConnState('ok');

				const lines: string[] = [];
				if (res.account_id) lines.push(`Account: ${res.account_id}`);
				if (typeof res.livemode === 'boolean')
					lines.push(`Mode: ${res.livemode ? 'LIVE' : 'TEST'}`);
				if (res.country) lines.push(`Country: ${res.country}`);

				setBanner({
					variant: 'success',
					title: res.message || 'Keys are valid',
					body: lines.length ? lines.join('\n') : undefined,
				});

				toast.success('Stripe key validated with Stripe');
			} else {
				setConnState('error');
				setBanner({
					variant: 'error',
					title: 'Key test failed',
					body: res?.message || 'Could not validate the key with Stripe.',
				});
			}
		} catch (e: unknown) {
			const err = e as ApiError;
			setConnState('error');
			setBanner({
				variant: 'error',
				title: 'Key test failed',
				body: err?.message ?? 'Could not validate the key with Stripe.',
			});
		}
	}

	async function saveConfigAndContinue() {
		// If already completed + configured, just proceed
		if (connectStripeDone && configured) {
			window.location.href = '/admin/setup/test-purchase';
			return;
		}

		setBanner(null);
		setSaveState('saving');

		const payload: StripeConfigPayload = {
			stripe_secret_key: secretKey.trim(),
			stripe_webhook_secret: webhookSecret.trim(),
		};

		const pk = publishableKey.trim();
		if (pk) payload.stripe_publishable_key = pk;

		try {
			const res = await api<StripeConfigResponse>('/stripe/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				cache: 'no-store',
			});

			if (res?.ok) {
				setSaveState('ok');

				// ✅ mark onboarding step done
				await markConnectStripeDone({
					source: 'connect-stripe-wizard',
					webhook_endpoint: endpointUrl,
					has_publishable_key: !!pk,
					mode_hint: secretKey.startsWith('sk_live_') ? 'live' : 'test',
				});

				setBanner({
					variant: 'success',
					title: 'Stripe configured ✅',
					body: `Saved successfully.\nNext: ensure Stripe webhook points to:\n${endpointUrl}`,
				});

				await refreshSnapshot();

				setTimeout(() => {
					window.location.href = '/admin/setup/test-purchase';
				}, 800);
			} else {
				setSaveState('error');
				setBanner({
					variant: 'error',
					title: 'Save failed',
					body: 'Unexpected response from server.',
				});
			}
		} catch (e: unknown) {
			const err = e as ApiError;
			setSaveState('error');
			setBanner({
				variant: 'error',
				title: 'Save failed',
				body: err?.message ?? 'Could not save Stripe config.',
			});
		} finally {
			setTimeout(() => setSaveState('idle'), 400);
		}
	}

	return (
		<main className='mx-auto max-w-[760px] px-4 py-10 md:px-6'>
			<LoadingOverlay
				show={
					snapshotLoading ||
					onboardingLoading ||
					connState === 'testing' ||
					saveState === 'saving'
				}
				title={
					connState === 'testing'
						? 'Testing keys…'
						: saveState === 'saving'
							? 'Saving Stripe config…'
							: 'Loading…'
				}
				message={
					connState === 'testing'
						? 'Validating your Stripe credentials with Stripe.'
						: saveState === 'saving'
							? 'Persisting Stripe keys to your tenant.'
							: 'Fetching current Stripe configuration.'
				}
			/>

			<WizardStepper step={step} total={total} rightText='STRIPE INTEGRATION' />

			{/* Header */}
			<div className='mt-8'>
				<h1 className='text-4xl font-extrabold tracking-tight text-slate-900'>
					Connect your Stripe Account
				</h1>
				<p className='mt-2 text-base font-medium text-slate-500'>
					Enter your API keys to start accepting subscription payments
					immediately.
				</p>

				<div className='mt-4 flex items-center gap-2'>
					{configured ? (
						<span className='inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700'>
							<FiCheckCircle className='h-4 w-4' />
							Configured
						</span>
					) : (
						<span className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-600'>
							<FiXCircle className='h-4 w-4' />
							Not configured
						</span>
					)}

					{connectStripeDone ? (
						<span className='inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700'>
							<FiCheckCircle className='h-4 w-4' />
							Onboarding step done
						</span>
					) : null}
				</div>
			</div>

			{/* banner */}
			<div className='mt-6 space-y-3'>
				{banner ? (
					<Banner
						variant={banner.variant}
						title={banner.title}
						body={banner.body}
						onClose={() => setBanner(null)}
					/>
				) : null}
			</div>

			{/* Main card */}
			<div className='mt-8'>
				<CardShell title='' subtitle='' right={null}>
					<div className='space-y-7'>
						<TextInputField
							label='Publishable Key'
							value={publishableKey}
							onChange={setPublishableKey}
							placeholder='pk_live_...'
							hint='Find it in Stripe Dashboard → Developers → API keys.'
						/>

						<div>
							<div className='flex items-end justify-between gap-3'>
								<div className='text-xs font-bold text-slate-700'>
									Secret Key
								</div>

								<a
									href='https://dashboard.stripe.com/apikeys'
									target='_blank'
									rel='noreferrer'
									className='text-xs font-extrabold text-blue-600 hover:text-blue-700'
								>
									Where do I find this?
								</a>
							</div>

							<div className='mt-2'>
								<TextInputField
									label={''}
									value={secretKey}
									onChange={setSecretKey}
									placeholder='sk_live_...'
									type='password'
									autoComplete='off'
									required
								/>
							</div>
						</div>

						{/* Webhook configuration inner panel */}
						<div className='rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6'>
							<div className='text-lg font-extrabold text-slate-900'>
								Webhook Configuration
							</div>
							<p className='mt-1 text-sm font-semibold text-slate-500'>
								Add this endpoint to your Stripe Dashboard &gt; Developers &gt;
								Webhooks.
							</p>

							{/* Endpoint URL */}
							<div className='mt-6'>
								<div className='text-xs font-extrabold tracking-widest text-slate-400'>
									ENDPOINT URL
								</div>

								<div className='mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
									<div className='grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600'>
										<span className='text-base font-black'>⛓</span>
									</div>

									<div className='min-w-0 flex-1 truncate font-mono text-sm font-bold text-slate-700'>
										{endpointUrl}
									</div>

									<button
										type='button'
										onClick={onCopyEndpoint}
										className='grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100'
										aria-label='Copy endpoint URL'
										title='Copy'
									>
										<FiCopy className='h-5 w-5' />
									</button>
								</div>
							</div>

							{/* Webhook secret */}
							<div className='mt-6'>
								<TextInputField
									label='Webhook Secret'
									value={webhookSecret}
									onChange={setWebhookSecret}
									placeholder='whsec_...'
									hint='After creating the webhook, reveal and paste the signing secret.'
									required
								/>
							</div>

							{/* Warning */}
							{webhookMissing && (
								<div className='mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4'>
									<div className='flex items-start gap-3'>
										<div className='mt-0.5 text-amber-700'>
											<FiAlertTriangle className='h-5 w-5' />
										</div>
										<div className='min-w-0'>
											<div className='text-sm font-extrabold text-amber-900'>
												Webhook Secret Required
											</div>
											<div className='mt-1 text-sm font-semibold leading-6 text-amber-800'>
												You must configure the webhook secret, or subscription
												updates (like cancellations) will not sync with
												Enrollait.
											</div>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Footer row inside card */}
						<div className='flex flex-col items-stretch justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center'>
							<Link
								href='/admin/setup/test-purchase'
								className='text-sm font-extrabold text-slate-500 hover:text-slate-700'
							>
								Skip for now
							</Link>

							<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'>
								<button
									type='button'
									onClick={testKeys}
									disabled={!canTest}
									className={clsx(
										'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50',
										!canTest && 'cursor-not-allowed opacity-60',
									)}
								>
									<IoKeySharp className='h-4 w-4' />
									{connState === 'testing' ? 'Testing…' : 'Test Keys'}
								</button>

								<button
									type='button'
									onClick={saveConfigAndContinue}
									disabled={!canSave}
									className={clsx(
										'inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700',
										!canSave &&
											'cursor-not-allowed bg-slate-300 hover:bg-slate-300',
									)}
								>
									Save &amp; Continue
								</button>
							</div>
						</div>
					</div>
				</CardShell>
			</div>
		</main>
	);
}
