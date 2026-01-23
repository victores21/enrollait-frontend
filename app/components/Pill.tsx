import clsx from '@/lib/clsx';

export function Pill({
	variant,
	children,
}: {
	variant: 'green' | 'slate' | 'amber' | 'rose' | 'blue';
	children: React.ReactNode;
}) {
	return (
		<span
			className={clsx(
				'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold',
				variant === 'green' && 'bg-emerald-50 text-emerald-700',
				variant === 'slate' && 'bg-slate-100 text-slate-700',
				variant === 'amber' && 'bg-amber-50 text-amber-700',
				variant === 'rose' && 'bg-rose-50 text-rose-700',
				variant === 'blue' && 'bg-blue-50 text-blue-700',
			)}
		>
			<span
				className={clsx(
					'h-1.5 w-1.5 rounded-full',
					variant === 'green' && 'bg-emerald-500',
					variant === 'slate' && 'bg-slate-400',
					variant === 'amber' && 'bg-amber-500',
					variant === 'rose' && 'bg-rose-500',
					variant === 'blue' && 'bg-blue-500',
				)}
			/>
			{children}
		</span>
	);
}
