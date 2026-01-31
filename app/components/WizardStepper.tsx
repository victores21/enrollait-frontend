'use client';

type WizardHeaderProps = {
	step: number;
	total: number;
	rightText: string;
	className?: string;
	progressClassName?: string;
};

export default function WizardStepper({
	step,
	total,
	rightText,
	className = '',
	progressClassName = '',
}: WizardHeaderProps) {
	const pct = total > 0 ? Math.round((step / total) * 100) : 0;

	return (
		<div className={className}>
			{/* Top bar */}
			<div className='flex items-center justify-between gap-4'>
				<div className='text-sm font-extrabold text-slate-900'>
					Step {step} of {total}
				</div>
				<div className='text-sm font-extrabold tracking-wide text-slate-500'>
					{rightText}
				</div>
			</div>

			{/* Progress */}
			<div
				className={`mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-300 ${progressClassName}`}
			>
				<div
					className='h-full rounded-full bg-blue-600 transition-all'
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}
