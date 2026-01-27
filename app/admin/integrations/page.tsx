'use client';

import CardShell from '@/app/components/CardShell';
import { IntegrationCard } from '@/app/components/IntegrationCardItem';
import { Pill } from '@/app/components/Pill';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import {
	FiLink,
	FiSettings,
	FiCheckCircle,
	FiClock,
	FiXCircle,
	FiBookOpen,
	FiCreditCard,
} from 'react-icons/fi';

import { api } from '@/lib/api/api';

type IntegrationStatus = 'connected' | 'pending' | 'disconnected';

type Integration = {
	key: 'moodle' | 'stripe';
	name: string;
	description: string;
	icon: React.ReactNode;
	image: string;
	status: IntegrationStatus;
	primaryCta: { label: string; href: string };
	secondaryCta?: { label: string; href: string };
};

type IntegrationsStatusResponse = {
	ok: boolean;
	tenant_id: number;
	all_configured: boolean;
	moodle: {
		configured: boolean;
		missing: string[];
		moodle_url?: string | null;
	};
	stripe: {
		configured: boolean;
		missing: string[];
		stripe_publishable_key?: string | null;
	};
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

/**
 * Mapping:
 * - configured => connected
 * - some fields set but not all required => pending
 * - none set => disconnected
 */
function statusFromConfig(
	configured: boolean,
	missing: string[],
	requiredCount: number,
): IntegrationStatus {
	if (configured) return 'connected';
	if (missing.length > 0 && missing.length < requiredCount) return 'pending';
	return 'disconnected';
}

export default function AdminIntegrationsPage() {
	const [remoteStatus, setRemoteStatus] =
		useState<IntegrationsStatusResponse | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let alive = true;

		(async () => {
			try {
				const res = await api<IntegrationsStatusResponse>(
					'/integrations/status',
					{
						method: 'GET',
						cache: 'no-store',
					},
				);
				if (!alive) return;
				setRemoteStatus(res);
			} catch {
				if (!alive) return;
				setRemoteStatus(null);
			} finally {
				if (!alive) return;
				setLoading(false);
			}
		})();

		return () => {
			alive = false;
		};
	}, []);

	const integrations = useMemo<Integration[]>(() => {
		const moodleStatus: IntegrationStatus = remoteStatus
			? statusFromConfig(
					remoteStatus.moodle.configured,
					remoteStatus.moodle.missing,
					2,
				)
			: 'disconnected';

		const stripeStatus: IntegrationStatus = remoteStatus
			? statusFromConfig(
					remoteStatus.stripe.configured,
					remoteStatus.stripe.missing,
					2,
				)
			: 'disconnected';

		return [
			{
				key: 'moodle',
				name: 'Moodle',
				description: 'Learning Platform or Learning Management System (LMS)',
				image: '/moodle-logo.webp',
				icon: <FiBookOpen className='h-5 w-5' />,
				status: moodleStatus,
				primaryCta: { label: 'Manage', href: '/admin/integrations/moodle' },
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
				status: stripeStatus,
				primaryCta: { label: 'Manage', href: '/admin/integrations/stripe' },
				image: '/stripe-logo.png',
				secondaryCta: {
					label: 'Docs',
					href: '/admin/integrations/stripe/docs',
				},
			},
		];
	}, [remoteStatus]);

	return (
		<>
			<LoadingOverlay
				show={loading}
				title='Loading integrations…'
				message='Fetching configuration status.'
			/>

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
		</>
	);
}
