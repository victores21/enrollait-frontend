'use client';

import clsx from '@/lib/clsx';

type LoadingOverlayProps = {
	show: boolean;
	title?: string;
	message?: string;
	/** If false, overlay doesn't block clicks */
	blocking?: boolean;
	/** Optional: adds blur behind */
	blur?: boolean;
};

export default function LoadingOverlay({
	show,
	title = 'Working…',
	message = 'Please wait a moment.',
	blocking = true,
	blur = true,
}: LoadingOverlayProps) {
	if (!show) return null;

	return (
		<div
			className={clsx(
				'fixed inset-0 z-[9999] flex items-center justify-center',
				blocking ? 'pointer-events-auto' : 'pointer-events-none',
			)}
			aria-live='polite'
			aria-busy='true'
		>
			{/* Backdrop */}
			<div
				className={clsx(
					'absolute inset-0 bg-slate-900/40',
					blur ? 'backdrop-blur-[10px]' : '',
				)}
			/>

			{/* Card */}
			<div
				role='status'
				className='relative w-[92%] max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl'
			>
				<div className='flex items-start gap-3'>
					<Spinner />
					<div className='min-w-0'>
						<div className='text-sm font-extrabold text-slate-900'>{title}</div>
						<div className='mt-0.5 text-xs font-semibold text-slate-500'>
							{message}
						</div>
					</div>
				</div>

				{/* Shimmer bar */}
				<div className='mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100'>
					<div className='h-full w-1/2 animate-loading-bar rounded-full bg-slate-300' />
				</div>

				{/* Accessibility text */}
				<span className='sr-only'>Loading</span>
			</div>

			<style jsx>{`
				@keyframes loadingBar {
					0% {
						transform: translateX(-60%);
					}
					100% {
						transform: translateX(220%);
					}
				}
				.animate-loading-bar {
					animation: loadingBar 1.1s ease-in-out infinite;
				}
			`}</style>
		</div>
	);
}

function Spinner() {
	return (
		<div className='mt-0.5 h-10 w-10 shrink-0 rounded-2xl bg-slate-50 ring-1 ring-slate-200 grid place-items-center'>
			<div className='h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700' />
		</div>
	);
}
