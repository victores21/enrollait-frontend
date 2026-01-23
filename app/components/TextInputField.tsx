import clsx from '@/lib/clsx';
import FieldLabel from './FieldLabel';
import FieldError from './FieldError';

export default function TextInputField({
	label,
	hint,
	required,
	value,
	onChange,
	placeholder,
	error,
	inputMode,
}: {
	label: React.ReactNode;
	hint?: string;
	required?: boolean;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	error?: string;
	inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
	return (
		<div>
			<FieldLabel required={required} hint={hint}>
				{label}
			</FieldLabel>
			<input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className={clsx(
					'w-full rounded-2xl border bg-white px-4 py-3 text-sm font-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-4',
					error
						? 'border-rose-300 focus:border-rose-300 focus:ring-rose-100'
						: 'border-slate-200 focus:border-blue-300 focus:ring-blue-100',
				)}
				placeholder={placeholder}
				inputMode={inputMode}
			/>
			<FieldError error={error} />
		</div>
	);
}
