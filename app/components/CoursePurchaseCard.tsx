// 'use client';

// import Image from 'next/image';
// import { FiArrowRight } from 'react-icons/fi';
// import { loadStripe } from '@stripe/stripe-js';
// import {
// 	EmbeddedCheckoutProvider,
// 	EmbeddedCheckout,
// } from '@stripe/react-stripe-js';
// import { useCallback, useMemo } from 'react';

// type PreviewMedia =
// 	| {
// 			type: 'image';
// 			src: string;
// 			alt?: string;
// 	  }
// 	| {
// 			type: 'video';
// 			src: string;
// 			poster?: string;
// 	  };

// type CoursePurchaseCardProps = {
// 	price: number;
// 	oldPrice?: number;
// 	discountText?: string;
// 	offerEnds?: string;
// 	preview: PreviewMedia;
// 	onBuy?: () => void;
// };

// function FeatureRow({ icon, title }: { icon: React.ReactNode; title: string }) {
// 	return (
// 		<div className='flex items-center gap-2 text-xs text-slate-600'>
// 			{icon}
// 			<span>{title}</span>
// 		</div>
// 	);
// }

// export default function CoursePurchaseCard({
// 	price,
// 	oldPrice,
// 	discountText,
// 	offerEnds,
// 	preview,
// 	onBuy,
// }: CoursePurchaseCardProps) {
// 	const stripePromise = loadStripe(
// 		process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
// 	);
// 	const fetchClientSecret = useCallback(async () => {
// 		const response = await fetch('/api/payment', {
// 			method: 'POST',
// 			headers: { 'Content-Type': 'application/json' },
// 			body: JSON.stringify({ price }),
// 		});

// 		if (!response.ok) {
// 			throw new Error('Failed to create session');
// 		}

// 		const data = await response.json();
// 		return data.client_secret as string;
// 	}, [price]);

// 	const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

// 	return (
// 		<div className='rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-200 ease-out '>
// 			<EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
// 				<EmbeddedCheckout className='w-full' />
// 			</EmbeddedCheckoutProvider>
// 			{/* ================= PREVIEW ================= */}
// 			<div className='relative overflow-hidden rounded-t-2xl bg-slate-100'>
// 				<div className='aspect-[16/9] w-full'>
// 					{preview.type === 'image' && (
// 						<Image
// 							src={preview.src || ''}
// 							alt={preview.alt ?? 'Course preview'}
// 							fill
// 							className='object-cover'
// 						/>
// 					)}

// 					{preview.type === 'video' && (
// 						<video
// 							src={preview.src}
// 							poster={preview.poster}
// 							className='h-full w-full object-cover'
// 							controls
// 						/>
// 					)}
// 				</div>

// 				{/* Overlay play button (only for image previews) */}
// 				{/* {preview.type === 'image' && (
// 					<div className='absolute inset-0 grid place-items-center'>
// 						<button className='inline-flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-black/80'>
// 							<FiPlay className='h-4 w-4' />
// 							Preview Course
// 						</button>
// 					</div>
// 				)} */}
// 			</div>

// 			{/* ================= CONTENT ================= */}
// 			<div className='p-5'>
// 				{/* Price */}
// 				<div className='flex items-end justify-between gap-3'>
// 					<div className='flex items-end gap-2'>
// 						<span className='text-2xl font-extrabold text-slate-900'>
// 							${price.toFixed(2)}
// 						</span>

// 						{oldPrice && (
// 							<span className='pb-1 text-xs text-slate-400 line-through'>
// 								${oldPrice.toFixed(2)}
// 							</span>
// 						)}
// 					</div>

// 					{discountText && (
// 						<span className='rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200'>
// 							{discountText}
// 						</span>
// 					)}
// 				</div>

// 				{/* Offer */}
// 				{offerEnds && (
// 					<div className='mt-4 flex items-center justify-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-rose-200'>
// 						<span className='h-2 w-2 rounded-full bg-rose-500' />
// 						{offerEnds}
// 					</div>
// 				)}

// 				{/* Email + CTA */}
// 				<div className='mt-4'>
// 					{/* <p className='text-xs font-semibold text-slate-700'>
// 						Get access instructions:
// 					</p>

// 					<input
// 						className='mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
// 						placeholder='Enter your email'
// 					/> */}

// 					<button
// 						onClick={() => {
// 							console.log('Buy');
// 						}}
// 						className='mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 cursor-pointer'
// 					>
// 						Buy Course
// 						<FiArrowRight className='h-4 w-4' />
// 					</button>

// 					<p className='mt-2 text-center text-[11px] text-slate-500'>
// 						You&apos;ll be enrolled automatically in Moodle.
// 					</p>
// 				</div>

// 				{/* Footer links */}
// 				<div className='mt-5 flex items-center justify-center gap-5 text-sm text-slate-500'>
// 					<a className='text-primary font-bold hover:text-slate-700' href='#'>
// 						Share
// 					</a>
// 					<a className='text-primary font-bold hover:text-slate-700' href='#'>
// 						Apply Coupon
// 					</a>
// 				</div>

// 				<div className='mt-3 text-center text-[11px] text-slate-400'>
// 					Secured by Stripe
// 				</div>
// 			</div>
// 		</div>
// 	);
// }

'use client';

import Image from 'next/image';
import { FiArrowRight } from 'react-icons/fi';
import { ProductForStripeCheckout, ProductItem } from '../types';
import StripeButton from './StripeButton';

type PreviewMedia =
	| {
			type: 'image';
			src: string;
			alt?: string;
	  }
	| {
			type: 'video';
			src: string;
			poster?: string;
	  };

type CoursePurchaseCardProps = {
	product: ProductForStripeCheckout; // ✅ pass full product instead of only price
	oldPrice?: number;
	discountText?: string;
	offerEnds?: string;
	preview: PreviewMedia;

	// Optional: if you already have email
	customerEmail?: string;
};

export default function CoursePurchaseCard({
	product,
	oldPrice,
	discountText,
	offerEnds,
	preview,
	customerEmail,
}: CoursePurchaseCardProps) {
	// show price from backend strings
	const displayPrice =
		product.discounted_price && product.discounted_price !== product.price
			? Number(product.discounted_price)
			: Number(product.price);

	return (
		<div className='rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-200 ease-out'>
			{/* ================= PREVIEW ================= */}
			<div className='relative overflow-hidden rounded-t-2xl bg-slate-100'>
				<div className='aspect-[16/9] w-full'>
					{preview.type === 'image' && (
						<Image
							src={preview.src || ''}
							alt={preview.alt ?? 'Course preview'}
							fill
							className='object-cover'
						/>
					)}

					{preview.type === 'video' && (
						<video
							src={preview.src}
							poster={preview.poster}
							className='h-full w-full object-cover'
							controls
						/>
					)}
				</div>
			</div>

			{/* ================= CONTENT ================= */}
			<div className='p-5'>
				{/* Price */}
				<div className='flex items-end justify-between gap-3'>
					<div className='flex items-end gap-2'>
						<span className='text-2xl font-extrabold text-slate-900'>
							${displayPrice.toFixed(2)}
						</span>

						{oldPrice && (
							<span className='pb-1 text-xs text-slate-400 line-through'>
								${oldPrice.toFixed(2)}
							</span>
						)}
					</div>

					{discountText && (
						<span className='rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200'>
							{discountText}
						</span>
					)}
				</div>

				{/* Offer */}
				{offerEnds && (
					<div className='mt-4 flex items-center justify-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-rose-200'>
						<span className='h-2 w-2 rounded-full bg-rose-500' />
						{offerEnds}
					</div>
				)}

				{/* CTA */}
				<div className='mt-4'>
					{/* ✅ Stripe modal checkout button */}
					<StripeButton
						product={product}
						tenantId={product.tenant_id ?? 1} // default to 1
						customerEmail={customerEmail}
						buttonLabel={
							product.stock_status === 'available'
								? 'Buy Course'
								: 'Not Available'
						}
						className='bg-primary hover:bg-blue-700'
					/>

					{/* Optional icon on button: easiest is to add inside StripeButton, but here’s a hint text */}
					<div className='mt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500'>
						<FiArrowRight className='h-3.5 w-3.5' />
						<span>You&apos;ll be enrolled automatically in Moodle.</span>
					</div>
				</div>

				{/* Footer links */}
				<div className='mt-5 flex items-center justify-center gap-5 text-sm text-slate-500'>
					<a className='text-primary font-bold hover:text-slate-700' href='#'>
						Share
					</a>
					<a className='text-primary font-bold hover:text-slate-700' href='#'>
						Apply Coupon
					</a>
				</div>

				<div className='mt-3 text-center text-[11px] text-slate-400'>
					Secured by Stripe
				</div>
			</div>
		</div>
	);
}
