// src/lib/selectStyles.ts
import type { StylesConfig, GroupBase } from 'react-select';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOption = { label: string; value: any };

export type SelectStylesOptions = {
	radius?: number;
	minHeight?: number;
	hasError?: boolean;
};

export function createSelectStyles<
	Option extends AnyOption = AnyOption,
	IsMulti extends boolean = boolean,
	Group extends GroupBase<Option> = GroupBase<Option>,
>(opts: SelectStylesOptions = {}): StylesConfig<Option, IsMulti, Group> {
	const radius = opts.radius ?? 16;
	const minHeight = opts.minHeight ?? 48;

	return {
		control: (base, state) => ({
			...base,
			borderRadius: radius,
			minHeight,
			paddingLeft: 6,
			paddingRight: 6,
			backgroundColor: '#fff',
			borderColor: opts.hasError
				? '#fca5a5' // rose-300
				: state.isFocused
					? '#93c5fd' // blue-300
					: '#e2e8f0', // slate-200
			boxShadow: opts.hasError
				? '0 0 0 4px rgba(244, 63, 94, 0.10)'
				: state.isFocused
					? '0 0 0 4px rgba(59, 130, 246, 0.10)'
					: '0 1px 2px rgba(15, 23, 42, 0.06)',
			':hover': { borderColor: opts.hasError ? '#fca5a5' : '#e2e8f0' },
		}),
		valueContainer: (base) => ({
			...base,
			padding: '2px 6px',
		}),
		input: (base) => ({
			...base,
			margin: 0,
			padding: 0,
			fontWeight: 600,
			color: '#0f172a',
		}),
		placeholder: (base) => ({
			...base,
			fontWeight: 400,
			color: '#94a3b8',
		}),
		multiValue: (base) => ({
			...base,
			borderRadius: 9999,
			backgroundColor: 'rgb(255 251 235)',
			border: '1px solid rgb(253 230 138)',
		}),
		multiValueLabel: (base) => ({
			...base,
			fontWeight: 800,
			fontSize: 11,
			color: 'rgb(180 83 9)',
			padding: '3px 8px',
		}),
		multiValueRemove: (base) => ({
			...base,
			borderRadius: 9999,
			marginRight: 4,
			color: 'rgb(180 83 9)',
			':hover': {
				backgroundColor: 'rgb(254 243 199)',
				color: 'rgb(180 83 9)',
			},
		}),
		menu: (base) => ({
			...base,
			borderRadius: radius,
			overflow: 'hidden',
			border: '1px solid #e2e8f0',
			boxShadow:
				'0 12px 30px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06)',
		}),
		option: (base, state) => ({
			...base,
			fontSize: 13,
			fontWeight: 700,
			color: '#0f172a',
			backgroundColor: state.isFocused ? 'rgb(248 250 252)' : '#fff',
			':active': { backgroundColor: 'rgb(239 246 255)' },
		}),
	};
}
