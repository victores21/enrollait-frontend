'use client';

import Image from 'next/image';
import { FiPlay, FiArrowRight, FiShield, FiLock } from 'react-icons/fi';

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
	price: number;
	oldPrice?: number;
	discountText?: string;
	offerEnds?: string;
	preview: PreviewMedia;
	onBuy?: () => void;
};

function FeatureRow({ icon, title }: { icon: React.ReactNode; title: string }) {
	return (
		<div className='flex items-center gap-2 text-xs text-slate-600'>
			{icon}
			<span>{title}</span>
		</div>
	);
}

export default function CoursePurchaseCard({
	price,
	oldPrice,
	discountText,
	offerEnds,
	preview,
	onBuy,
}: CoursePurchaseCardProps) {
	return (
		<div className='rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-200 ease-out '>
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

				{/* Overlay play button (only for image previews) */}
				{/* {preview.type === 'image' && (
					<div className='absolute inset-0 grid place-items-center'>
						<button className='inline-flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-black/80'>
							<FiPlay className='h-4 w-4' />
							Preview Course
						</button>
					</div>
				)} */}
			</div>

			{/* ================= CONTENT ================= */}
			<div className='p-5'>
				{/* Price */}
				<div className='flex items-end justify-between gap-3'>
					<div className='flex items-end gap-2'>
						<span className='text-2xl font-extrabold text-slate-900'>
							${price.toFixed(2)}
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

				{/* Email + CTA */}
				<div className='mt-4'>
					{/* <p className='text-xs font-semibold text-slate-700'>
						Get access instructions:
					</p>

					<input
						className='mt-2 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
						placeholder='Enter your email'
					/> */}

					<button
						onClick={() => {
							console.log('Buy');
						}}
						className='mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 cursor-pointer'
					>
						Buy Course
						<FiArrowRight className='h-4 w-4' />
					</button>

					<p className='mt-2 text-center text-[11px] text-slate-500'>
						You&apos;ll be enrolled automatically in Moodle.
					</p>
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
