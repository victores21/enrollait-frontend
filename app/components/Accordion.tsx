'use client';

import * as React from 'react';

type AccordionContextValue = {
	openValue: string | null;
	setOpenValue: (v: string | null) => void;
	type: 'single' | 'multiple';
};

const AccordionContext = React.createContext<AccordionContextValue | null>(
	null
);

export function Accordion({
	children,
	type = 'single',
	defaultValue,
	value,
	onValueChange,
}: {
	children: React.ReactNode;
	type?: 'single' | 'multiple';
	defaultValue?: string | null;
	value?: string | null;
	onValueChange?: (v: string | null) => void;
}) {
	const [internal, setInternal] = React.useState<string | null>(
		defaultValue ?? null
	);

	const controlled = value !== undefined;
	const openValue = controlled ? value! : internal;

	const setOpenValue = (v: string | null) => {
		if (!controlled) setInternal(v);
		onValueChange?.(v);
	};

	return (
		<AccordionContext.Provider value={{ openValue, setOpenValue, type }}>
			<div>{children}</div>
		</AccordionContext.Provider>
	);
}

export function AccordionItem({
	value,
	children,
	className = 'cursor-pointer',
}: {
	value: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div data-acc-item={value} className={className}>
			{children}
		</div>
	);
}

export function AccordionTrigger({
	value,
	children,
	className = '',
	rightIcon,
}: {
	value: string;
	children: React.ReactNode;
	className?: string;
	rightIcon?: React.ReactNode;
}) {
	const ctx = React.useContext(AccordionContext);
	if (!ctx) throw new Error('AccordionTrigger must be used within Accordion');

	const isOpen = ctx.openValue === value;

	return (
		<button
			type='button'
			aria-expanded={isOpen}
			onClick={() => ctx.setOpenValue(isOpen ? null : value)}
			className={className}
		>
			{children}
			{rightIcon}
		</button>
	);
}

export function AccordionContent({
	value,
	children,
	className = '',
}: {
	value: string;
	children: React.ReactNode;
	className?: string;
}) {
	const ctx = React.useContext(AccordionContext);
	if (!ctx) throw new Error('AccordionContent must be used within Accordion');

	const isOpen = ctx.openValue === value;

	return (
		<div
			className={[
				'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
				isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
			].join(' ')}
		>
			<div className={'overflow-hidden ' + className}>{children}</div>
		</div>
	);
}
