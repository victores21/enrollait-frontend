'use client';

import CardShell from '@/app/components/CardShell';
import { IntegrationCard } from '@/app/components/IntegrationCardItem';
import { Pill } from '@/app/components/Pill';
import Link from 'next/link';
import { useMemo } from 'react';
import {
	FiLink,
	FiSettings,
	FiCheckCircle,
	FiClock,
	FiXCircle,
	FiBookOpen,
	FiCreditCard,
} from 'react-icons/fi';

type IntegrationStatus = 'connected' | 'pending' | 'disconnected';

type Integration = {
	key: string;
	name: string;
	description: string;
	icon: React.ReactNode;
	image: string;
	status: IntegrationStatus;
	primaryCta: { label: string; href: string };
	secondaryCta?: { label: string; href: string };
};

function StatusPill({ status }: { status: IntegrationStatus }) {
	if (status === 'connected')
		return (
			<Pill variant='green'>
				<FiCheckCircle className='h-3.5 w-3.5' />
				Connected
			</Pill>
		);
	if (status === 'pending')
		return (
			<Pill variant='amber'>
				<FiClock className='h-3.5 w-3.5' />
				Pending
			</Pill>
		);
	return (
		<Pill variant='slate'>
			<FiXCircle className='h-3.5 w-3.5' />
			Not connected
		</Pill>
	);
}

export default function AdminIntegrationsPage() {
	const integrations = useMemo<Integration[]>(
		() => [
			{
				key: 'moodle',
				name: 'Moodle',
				description: 'Learning Platform or Learning Management System (LMS)',
				image: '/moodle-logo.webp',
				icon: <FiBookOpen className='h-5 w-5' />,
				status: 'disconnected', // change later based on API
				primaryCta: { label: 'Configure', href: '/admin/integrations/moodle' },
				secondaryCta: {
					label: 'Docs',
					href: '/admin/integrations/moodle/docs',
				},
			},
			{
				key: 'stripe',
				name: 'Stripe',
				description:
					'Collect payments, create checkout sessions, and reconcile orders securely.',
				icon: <FiCreditCard className='h-5 w-5' />,
				status: 'connected', // change later based on API
				primaryCta: { label: 'Manage', href: '/admin/integrations/stripe' },
				image: '/stripe-logo.png',
				secondaryCta: {
					label: 'Webhooks',
					href: '/admin/integrations/stripe/webhooks',
				},
			},
		],
		[],
	);

	return (
		<main className='mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
				<div>
					<h1 className='text-2xl font-extrabold tracking-tight'>
						Integrations
					</h1>
					<p className='mt-1 text-sm font-medium text-slate-500'>
						Connect external services to power SSO, payments, and automation.
					</p>
				</div>

				<Link
					href='/admin/integrations'
					className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50'
				>
					<FiSettings className='text-slate-500' />
					Integration settings
				</Link>
			</div>

			<div className='mt-6'>
				<CardShell
					title='Available integrations'
					right={
						<div className='inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600'>
							<FiLink className='text-slate-400' />
							{integrations.length} integrations
						</div>
					}
				>
					<div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
						{integrations.map((it) => (
							<IntegrationCard key={it.key} it={it} StatusPill={StatusPill} />
						))}
					</div>
				</CardShell>
			</div>
		</main>
	);
}
