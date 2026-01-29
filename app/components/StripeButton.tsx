'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
	EmbeddedCheckoutProvider,
	EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { FiArrowRight, FiX } from 'react-icons/fi';
import { ProductForStripeCheckout } from '../types';

const stripePromise = loadStripe(
	process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type StripeButtonProps = {
	product: ProductForStripeCheckout;
	tenantId?: number; // default 1
	buttonLabel?: string;
	className?: string;

	// Optional: pass customer email if you already have it (Stripe will prefill)
	customerEmail?: string;

	// Optional: return URL override
	returnUrl?: string;
};

export default function StripeButton({
	product,
	tenantId = 1,
	buttonLabel = 'Buy Course',
	className = '',
	customerEmail,
	returnUrl,
}: StripeButtonProps) {
	const [open, setOpen] = useState(false);
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	console.log('Product', product);
	// Close on ESC
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false);
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open]);

	const options = useMemo(() => {
		// When using EmbeddedCheckoutProvider, you can provide clientSecret directly
		return clientSecret ? { clientSecret } : undefined;
	}, [clientSecret]);

	async function createCheckoutSession() {
		setLoading(true);
		setError(null);
		setClientSecret(null);

		try {
			// const res = await fetch('/api/payment', {
			// 	method: 'POST',
			// 	headers: { 'Content-Type': 'application/json' },
			// 	body: JSON.stringify({
			// 		tenant_id: tenantId,
			// 		product,
			// 		customer_email: customerEmail ?? null,
			// 		return_url: returnUrl ?? null,
			// 	}),
			// });

			// const data = (await res.json()) as CreateSessionResponse;
			console.log(
				'LA URL A LLAMAR',
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/stripe/checkout/session`,
			);
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_BACKEND_URL}/stripe/checkout/session`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						product_id: product.id,
						customer_email: customerEmail ?? null,
						// return_url optional; backend will infer
					}),
				},
			);
			const data = await res.json();

			if (!res.ok || !data.ok) {
				throw new Error(!data.ok ? data.message : 'Failed to create session');
			}

			setClientSecret(data.client_secret);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			setError(e?.message ?? 'Failed to create checkout session');
		} finally {
			setLoading(false);
		}
	}

	function onClickBuy() {
		setOpen(true);
		void createCheckoutSession();
	}

	function closeModal() {
		setOpen(false);
		setClientSecret(null);
		setError(null);
		setLoading(false);
	}

	return (
		<>
			<button
				onClick={onClickBuy}
				disabled={loading || product.stock_status !== 'available'}
				className={[
					'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-sm hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 p-7 cursor-pointer',
					className,
				].join(' ')}
			>
				{loading ? 'Opening checkout…' : buttonLabel}{' '}
				<FiArrowRight className='h-4 w-4' />
			</button>

			{/* Modal */}
			{open && (
				<div className='fixed inset-0 z-50'>
					{/* Backdrop */}
					<div className='absolute inset-0 bg-black/50' onClick={closeModal} />

					{/* Panel */}
					<div className='absolute inset-0 flex items-center justify-center'>
						<div className='relative w-full h-full overflow-hidden  bg-white shadow-2xl ring-black/10'>
							{/* Header */}
							<div className='flex items-center justify-between border-b border-slate-200 px-4 py-3'>
								<div className='min-w-0'>
									<div className='truncate text-sm font-extrabold text-slate-900'>
										Checkout — {product.title}
									</div>
									<div className='text-xs text-slate-500'>
										Tenant: {tenantId} • Product #{product.id}
									</div>
								</div>

								<button
									onClick={closeModal}
									className='grid h-9 w-9 place-items-center rounded-lg hover:bg-slate-100'
									aria-label='Close checkout'
								>
									<FiX className='h-5 w-5 text-slate-700' />
								</button>
							</div>

							{/* Body */}
							<div className='max-h-[80vh] overflow-auto p-3'>
								{error && (
									<div className='mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200'>
										{error}
									</div>
								)}

								{!clientSecret && !error && (
									<div className='grid place-items-center py-14 text-sm text-slate-600'>
										Preparing Stripe Checkout…
									</div>
								)}

								{clientSecret && options && (
									<EmbeddedCheckoutProvider
										stripe={stripePromise}
										options={options}
									>
										<EmbeddedCheckout />
									</EmbeddedCheckoutProvider>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
