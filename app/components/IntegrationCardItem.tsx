'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { FiArrowUpRight } from 'react-icons/fi';

export type IntegrationStatus = 'connected' | 'pending' | 'disconnected';

export type IntegrationCardItem = {
	key: string;
	name: string;
	description: string;
	image: string;
	status: IntegrationStatus;
	primaryCta: { label: string; href: string };
	secondaryCta?: { label: string; href: string };
};

/**
 * Expects your existing:
 * - <Pill variant="...">...</Pill>
 * - Status icon components passed in via props (so this stays reusable)
 */
export function IntegrationCard({
	it,
	StatusPill,
}: {
	it: IntegrationCardItem;
	StatusPill: React.ComponentType<{ status: IntegrationStatus }>;
}) {
	return (
		<div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
			<div className='flex items-start justify-between gap-4'>
				<div className='flex flex-col items-start gap-4'>
					<div className='flex h-[50px] w-[100px] items-center justify-center'>
						<Image
							className='p-2'
							src={it.image}
							alt={it.name}
							width={100}
							height={100}
							// Next 13+/15+ prefers style over objectFit prop
							style={{ objectFit: 'contain' }}
						/>
					</div>

					<div className='min-w-0'>
						<div className='flex flex-wrap items-center gap-2'>
							<div className='text-base font-bold text-slate-900'>
								{it.name}
							</div>
							<StatusPill status={it.status} />
						</div>

						<p className='mt-1 text-sm font-medium text-slate-600'>
							{it.description}
						</p>
					</div>
				</div>
			</div>

			<div className='mt-5 flex flex-col gap-2 sm:flex-row sm:items-center'>
				<Link
					href={it.primaryCta.href}
					className='inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 sm:w-auto'
				>
					{it.primaryCta.label}
					<FiArrowUpRight />
				</Link>

				{it.secondaryCta ? (
					<Link
						href={it.secondaryCta.href}
						className='inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto'
					>
						{it.secondaryCta.label}
					</Link>
				) : null}

				<div className='sm:ml-auto text-xs font-bold text-slate-500'>
					{it.status === 'connected'
						? 'This integration is active.'
						: it.status === 'pending'
							? 'Finish setup to activate.'
							: 'Not configured yet.'}
				</div>
			</div>
		</div>
	);
}
