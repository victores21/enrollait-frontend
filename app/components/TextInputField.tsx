// 'use client';

// import { useId, useMemo, useState } from 'react';
// import clsx from '@/lib/clsx';
// import FieldLabel from './FieldLabel';
// import FieldError from './FieldError';
// import { FiEye, FiEyeOff } from 'react-icons/fi';

// export default function TextInputField({
// 	label,
// 	hint,
// 	required,
// 	value,
// 	onChange,
// 	placeholder,
// 	error,
// 	inputMode,
// 	type = 'text',
// 	name,
// 	autoComplete,
// 	disabled,
// }: {
// 	label: React.ReactNode;
// 	hint?: string;
// 	required?: boolean;
// 	value: string;
// 	onChange: (v: string) => void;
// 	placeholder?: string;
// 	error?: string;
// 	inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
// 	type?: 'text' | 'password' | 'email' | 'url' | 'number';
// 	name?: string;
// 	autoComplete?: string;
// 	disabled?: boolean;
// }) {
// 	const reactId = useId();
// 	const inputId = useMemo(() => `ti_${reactId.replace(/:/g, '')}`, [reactId]);

// 	const isPassword = type === 'password';
// 	const [show, setShow] = useState(false);

// 	return (
// 		<div>
// 			<FieldLabel required={required} hint={hint}>
// 				{label}
// 			</FieldLabel>

// 			<div className='relative'>
// 				<input
// 					id={inputId}
// 					name={name}
// 					value={value}
// 					onChange={(e) => onChange(e.target.value)}
// 					type={isPassword ? (show ? 'text' : 'password') : type}
// 					className={clsx(
// 						'w-full rounded-2xl border bg-white px-4 py-3 text-sm font-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-4',
// 						isPassword ? 'pr-14' : '',
// 						disabled ? 'cursor-not-allowed bg-slate-50 text-slate-500' : '',
// 						error
// 							? 'border-rose-300 focus:border-rose-300 focus:ring-rose-100'
// 							: 'border-slate-200 focus:border-blue-300 focus:ring-blue-100',
// 					)}
// 					placeholder={placeholder}
// 					inputMode={inputMode}
// 					autoComplete={autoComplete}
// 					disabled={disabled}
// 				/>

// 				{isPassword && (
// 					<button
// 						type='button'
// 						onClick={() => setShow((v) => !v)}
// 						className='absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100'
// 						aria-label={show ? 'Hide password' : 'Show password'}
// 						disabled={disabled}
// 					>
// 						{show ? (
// 							<FiEyeOff className='h-5 w-5' />
// 						) : (
// 							<FiEye className='h-5 w-5' />
// 						)}
// 					</button>
// 				)}
// 			</div>

// 			<FieldError error={error} />
// 		</div>
// 	);
// }

'use client';

import { useState } from 'react';
import clsx from '@/lib/clsx';
import FieldLabel from './FieldLabel';
import FieldError from './FieldError';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function TextInputField({
	id, // ✅ stable id (optional)
	label,
	hint,
	required,
	value,
	onChange,
	placeholder,
	error,
	inputMode,
	type = 'text',
	name,
	autoComplete,
	disabled,
}: {
	id?: string;
	label: React.ReactNode;
	hint?: string;
	required?: boolean;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	error?: string;
	inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
	type?: 'text' | 'password' | 'email' | 'url' | 'number';
	name?: string;
	autoComplete?: string;
	disabled?: boolean;
}) {
	const isPassword = type === 'password';
	const [show, setShow] = useState(false);

	return (
		<div>
			<FieldLabel required={required} hint={hint}>
				{label}
			</FieldLabel>

			<div className='relative'>
				<input
					// ✅ If you need an id, pass it from parent (stable).
					// Otherwise omit it to avoid hydration mismatch.
					id={id}
					name={name}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					type={isPassword ? (show ? 'text' : 'password') : type}
					className={clsx(
						'w-full rounded-2xl border bg-white px-4 py-3 text-sm font-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-4',
						isPassword ? 'pr-14' : '',
						disabled ? 'cursor-not-allowed bg-slate-50 text-slate-500' : '',
						error
							? 'border-rose-300 focus:border-rose-300 focus:ring-rose-100'
							: 'border-slate-200 focus:border-blue-300 focus:ring-blue-100',
					)}
					placeholder={placeholder}
					inputMode={inputMode}
					autoComplete={autoComplete}
					disabled={disabled}
				/>

				{isPassword && (
					<button
						type='button'
						onClick={() => setShow((v) => !v)}
						className='absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100'
						aria-label={show ? 'Hide password' : 'Show password'}
						disabled={disabled}
					>
						{show ? (
							<FiEyeOff className='h-5 w-5' />
						) : (
							<FiEye className='h-5 w-5' />
						)}
					</button>
				)}
			</div>

			<FieldError error={error} />
		</div>
	);
}
