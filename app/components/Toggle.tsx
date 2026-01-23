import clsx from '@/lib/clsx';

export default function Toggle({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: (v: boolean) => void;
	label?: string;
}) {
	return (
		<div className='flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
			<div className='min-w-0'>
				<div className='text-sm font-bold text-slate-900'>
					{label ?? 'Is published'}
				</div>
				<div className='mt-0.5 text-xs font-normal text-slate-500'>
					Control whether this product is visible in your marketplace.
				</div>
			</div>

			<button
				type='button'
				onClick={() => onChange(!checked)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						onChange(!checked);
					}
				}}
				role='switch'
				aria-checked={checked}
				aria-label='Toggle published'
				className={clsx(
					'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
					checked ? 'bg-primary' : 'bg-slate-200',
				)}
			>
				<span
					className={clsx(
						'absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform',
						checked ? 'translate-x-6' : 'translate-x-0',
					)}
				/>
			</button>
		</div>
	);
}
