import Select, { MultiValue } from 'react-select';
import FieldLabel from './FieldLabel';
import { createSelectStyles } from '@/lib/selectStyles';

type MultiSelectFieldProps<TOption> = {
	mounted: boolean;
	label: React.ReactNode;
	hint?: string;
	required?: boolean;
	instanceId: string;
	inputId: string;
	isLoading: boolean;
	options: TOption[];
	value: TOption[];
	onChange: (value: TOption[]) => void;
	placeholder?: string;
	noOptionsMessage?: () => string;
	error?: string | null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	selectStyles?: any;
};

export default function MultiSelectField<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	TOption extends { value: any; label: string },
>({
	mounted,
	label,
	hint,
	required,
	instanceId,
	inputId,
	isLoading,
	options,
	value,
	onChange,
	placeholder,
	noOptionsMessage,
	error,
	selectStyles,
}: MultiSelectFieldProps<TOption>) {
	const styles = createSelectStyles();
	const currentStyles = selectStyles || styles;
	return (
		<div>
			<FieldLabel required={required} hint={hint}>
				{label}
			</FieldLabel>

			{!mounted ? (
				<div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500'>
					Loading selector…
				</div>
			) : (
				<>
					<Select
						instanceId={instanceId}
						inputId={inputId}
						isMulti
						isLoading={isLoading}
						options={options}
						value={value}
						onChange={(v: MultiValue<TOption>) => onChange(v as TOption[])}
						placeholder={placeholder}
						noOptionsMessage={noOptionsMessage}
						classNamePrefix='enrollait-select'
						styles={currentStyles}
						components={{ IndicatorSeparator: () => null }}
					/>
					{error ? (
						<div className='mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-extrabold text-rose-700'>
							{error}
						</div>
					) : null}
				</>
			)}
		</div>
	);
}
