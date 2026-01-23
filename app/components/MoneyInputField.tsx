import clsx from '@/lib/clsx';
import FieldLabel from './FieldLabel';

export default function MoneyInputField({
	label,
	hint,
	required,
	value,
	onChange,
	placeholder,
	error,
	prefix = '$',
	trailing,
	inputMode = 'decimal',
}: {
	label: React.ReactNode;
	hint?: string;
	required?: boolean;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	error?: string;
	prefix?: string;
	trailing?: React.ReactNode;
	inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
	return (
		<div>
			<FieldLabel required={required} hint={hint}>
				{label}
			</FieldLabel>

			<div
				className={clsx(
					'flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 shadow-sm focus-within:ring-4',
					error
						? 'border-rose-300 focus-within:border-rose-300 focus-within:ring-rose-100'
						: 'border-slate-200 focus-within:border-blue-300 focus-within:ring-blue-100',
				)}
			>
				<span className='text-sm font-semibold text-slate-500'>{prefix}</span>
				<input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className='w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400'
					placeholder={placeholder}
					inputMode={inputMode}
				/>
				{trailing ? <div className='shrink-0'>{trailing}</div> : null}
			</div>

			{error ? (
				<div className='mt-2 text-xs font-semibold text-rose-700'>{error}</div>
			) : null}
		</div>
	);
}
