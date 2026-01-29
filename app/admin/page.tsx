'use client';

import Link from 'next/link';
import {
	FiAlertTriangle,
	FiCheckCircle,
	FiCircle,
	FiLoader,
} from 'react-icons/fi';
import { MeResponse } from '../types';
import { useEffect, useMemo, useState } from 'react';
import { api, qs } from '@/lib/api/api';
import Image from 'next/image';

function clsx(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(' ');
}

/* ----------------------------- Orders types/helpers ----------------------------- */

export type ApiOrderItem = {
	id: number;
	tenant_id: number;
	product_id: number | null;
	buyer_email: string | null;
	stripe_session_id: string | null;
	status: 'pending' | 'paid' | 'fulfilled' | 'expired' | string;
	created_at: string;
	total_cents: number | null;
	product?: {
		slug: string | null;
		title: string | null;
		image_url: string | null;
		price: string | null;
		discounted_price: string | null;
		currency: string | null;
	};
};

export type OrdersPagedResponse = {
	ok: boolean;
	tenant_id: number;
	page: number;
	page_size: number;
	total: number;
	total_pages: number;
	items: ApiOrderItem[];
};

function formatMoneyFromCents(
	cents: number | null | undefined,
	currency: string | null | undefined,
) {
	const cur = (currency || 'usd').toUpperCase();
	const n = Number(cents ?? 0);
	const amount = Number.isFinite(n) ? n / 100 : 0;

	try {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: cur,
			minimumFractionDigits: 2,
		}).format(amount);
	} catch {
		return `$${amount.toFixed(2)}`;
	}
}

function relativeTimeFromISO(iso?: string): string {
	if (!iso) return '—';
	const d = new Date(iso);
	const now = Date.now();
	const diff = Math.max(0, now - d.getTime());

	const minute = 60_000;
	const hour = 60 * minute;
	const day = 24 * hour;
	const week = 7 * day;

	if (diff < hour) return `${Math.max(1, Math.round(diff / minute))}m ago`;
	if (diff < day) return `${Math.round(diff / hour)}h ago`;
	if (diff < week) return `${Math.round(diff / day)}d ago`;
	return `${Math.round(diff / week)}w ago`;
}

/* -------------------------- Integrations status types -------------------------- */

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

type IntegrationStatus = 'connected' | 'pending' | 'disconnected';

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

function StatusDot({ status }: { status: IntegrationStatus }) {
	if (status === 'connected')
		return <span className='h-2 w-2 rounded-full bg-emerald-500' />;
	if (status === 'pending')
		return <span className='h-2 w-2 rounded-full bg-amber-500' />;
	return <span className='h-2 w-2 rounded-full bg-slate-300' />;
}

function StatusLabel({ status }: { status: IntegrationStatus }) {
	if (status === 'connected')
		return (
			<span className='inline-flex items-center gap-2 text-xs font-extrabold text-emerald-700'>
				<FiCheckCircle className='h-4 w-4' />
				Connected
			</span>
		);
	if (status === 'pending')
		return (
			<span className='inline-flex items-center gap-2 text-xs font-extrabold text-amber-700'>
				<FiCircle className='h-4 w-4' />
				Pending
			</span>
		);
	return (
		<span className='inline-flex items-center gap-2 text-xs font-extrabold text-slate-600'>
			<FiCircle className='h-4 w-4 text-slate-300' />
			Not connected
		</span>
	);
}

/* -------------------------------- UI components -------------------------------- */

function Sparkline({
	path,
	stroke = 'stroke-blue-500',
}: {
	path: string;
	stroke?: string;
}) {
	return (
		<svg viewBox='0 0 120 32' className='h-10 w-full'>
			<path
				d={path}
				fill='none'
				className={clsx(stroke, 'stroke-[2.5]')}
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		</svg>
	);
}

function Badge({
	variant = 'green',
	children,
}: {
	variant?: 'green' | 'red' | 'slate';
	children: React.ReactNode;
}) {
	return (
		<span
			className={clsx(
				'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold',
				variant === 'green' && 'bg-emerald-50 text-emerald-700',
				variant === 'red' && 'bg-rose-50 text-rose-700',
				variant === 'slate' && 'bg-slate-100 text-slate-700',
			)}
		>
			{children}
		</span>
	);
}

function KpiCard({
	label,
	value,
	trend,
	trendVariant,
	sparkPath,
	sparkStroke,
}: {
	label: string;
	value: string;
	trend: string;
	trendVariant: 'up' | 'down' | 'flat';
	sparkPath: string;
	sparkStroke: string;
}) {
	return (
		<div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'>
			<div className='flex items-center justify-between'>
				<div className='text-[11px] font-semibold tracking-wide text-slate-500'>
					{label.toUpperCase()}
				</div>

				{trendVariant === 'up' && (
					<Badge variant='green'>
						<span className='inline-block h-1.5 w-1.5 rounded-full bg-emerald-500' />
						{trend}
					</Badge>
				)}
				{trendVariant === 'down' && (
					<Badge variant='red'>
						<span className='inline-block h-1.5 w-1.5 rounded-full bg-rose-500' />
						{trend}
					</Badge>
				)}
				{trendVariant === 'flat' && <Badge variant='slate'>{trend}</Badge>}
			</div>

			<div className='mt-2 text-2xl font-extrabold tracking-tight text-slate-900'>
				{value}
			</div>

			<div className='mt-3'>
				<Sparkline path={sparkPath} stroke={sparkStroke} />
			</div>
		</div>
	);
}

function CardShell({
	title,
	right,
	children,
}: {
	title: string;
	right?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
			<div className='flex items-center justify-between border-b border-slate-200 px-5 py-4'>
				<div className='text-sm font-bold text-slate-900'>{title}</div>
				{right}
			</div>
			<div className='p-5'>{children}</div>
		</div>
	);
}

/* ---------------------------------- Page ---------------------------------- */

export default function AdminDashboardPage() {
	const [me, setMe] = useState<MeResponse | null>(null);

	// Recent orders state
	const [ordersLoading, setOrdersLoading] = useState(true);
	const [ordersError, setOrdersError] = useState<string | null>(null);
	const [recentOrders, setRecentOrders] = useState<ApiOrderItem[]>([]);

	// Integrations status state (NEW)
	const [intLoading, setIntLoading] = useState(true);
	const [intError, setIntError] = useState<string | null>(null);
	const [intStatus, setIntStatus] = useState<IntegrationsStatusResponse | null>(
		null,
	);

	useEffect(() => {
		(async () => {
			try {
				const r = await api<MeResponse>('/admin/auth/me', { method: 'GET' });
				setMe(r);
			} catch {
				setMe(null);
			}
		})();
	}, []);

	// Fetch last 10 orders
	useEffect(() => {
		let cancelled = false;

		(async () => {
			setOrdersLoading(true);
			setOrdersError(null);

			try {
				const res = await api<OrdersPagedResponse>(
					`/orders/paged` +
						qs({
							page: 1,
							page_size: 10,
							include_product: true,
						}),
					{ cache: 'no-store' },
				);

				if (cancelled) return;

				const sorted = [...(res.items ?? [])].sort((a, b) => {
					const ta = new Date(a.created_at).getTime();
					const tb = new Date(b.created_at).getTime();
					return tb - ta;
				});

				setRecentOrders(sorted.slice(0, 10));
			} catch (e: any) {
				if (cancelled) return;
				setOrdersError(e?.message ?? 'Failed to load recent orders');
			} finally {
				if (!cancelled) setOrdersLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	// Fetch integrations status (NEW)
	useEffect(() => {
		let cancelled = false;

		(async () => {
			setIntLoading(true);
			setIntError(null);

			try {
				const res = await api<IntegrationsStatusResponse>(
					'/integrations/status',
					{ method: 'GET', cache: 'no-store' },
				);
				if (cancelled) return;
				setIntStatus(res);
			} catch (e: any) {
				if (cancelled) return;
				setIntStatus(null);
				setIntError(e?.message ?? 'Failed to load integrations status');
			} finally {
				if (!cancelled) setIntLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	const recentOrderRows = useMemo(() => {
		return recentOrders.map((o) => {
			const email = (o.buyer_email || '').trim().toLowerCase() || '—';
			const course = o.product?.title?.trim() || '—';
			const amount = formatMoneyFromCents(o.total_cents, o.product?.currency);
			return {
				id: `#ORD-${o.id}`,
				email,
				course,
				amount,
				createdLabel: relativeTimeFromISO(o.created_at),
				rawId: o.id,
			};
		});
	}, [recentOrders]);

	const moodleStatus: IntegrationStatus = intStatus
		? statusFromConfig(intStatus.moodle.configured, intStatus.moodle.missing, 2)
		: 'disconnected';

	const stripeStatus: IntegrationStatus = intStatus
		? statusFromConfig(intStatus.stripe.configured, intStatus.stripe.missing, 2)
		: 'disconnected';

	return (
		<main className='mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<h1 className='text-2xl font-extrabold tracking-tight'>Overview</h1>
					<p className='mt-1 text-sm font-medium text-slate-500'>
						Welcome back, here&apos;s what&apos;s happening with your
						marketplace today.
					</p>
				</div>
			</div>

			{/* KPI cards */}
			{/* <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				<KpiCard
					label='Total Revenue'
					value='$12,450'
					trend='12%'
					trendVariant='up'
					sparkPath='M2 24 C 20 18, 26 26, 40 20 S 72 10, 92 18 S 110 20, 118 8'
					sparkStroke='stroke-blue-500'
				/>
				<KpiCard
					label='New Students'
					value='45'
					trend='5%'
					trendVariant='up'
					sparkPath='M2 24 C 18 24, 26 18, 40 20 S 66 24, 78 18 S 98 10, 118 16'
					sparkStroke='stroke-violet-500'
				/>
				<KpiCard
					label='Conversion Rate'
					value='3.2%'
					trend='0.5%'
					trendVariant='down'
					sparkPath='M2 10 C 24 12, 40 14, 58 16 S 92 22, 118 26'
					sparkStroke='stroke-rose-500'
				/>
				<KpiCard
					label='Enrollment Success'
					value='98.5%'
					trend='Stable'
					trendVariant='flat'
					sparkPath='M2 22 C 30 22, 46 22, 60 22 S 92 22, 118 22'
					sparkStroke='stroke-emerald-500'
				/>
			</div> */}

			{/* Two-column lower layout */}
			<div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12'>
				{/* Left: Recent Orders */}
				<div className='lg:col-span-8'>
					<CardShell
						title='Recent Orders'
						right={
							<Link
								href='/admin/orders'
								className='text-sm font-bold text-blue-600 hover:text-blue-700'
							>
								View All
							</Link>
						}
					>
						<div className='overflow-hidden rounded-xl border border-slate-200'>
							<div className='grid grid-cols-12 bg-slate-50 px-4 py-3 text-[11px] font-extrabold tracking-wider text-slate-500'>
								<div className='col-span-3'>ORDER ID</div>
								<div className='col-span-3'>EMAIL</div>
								<div className='col-span-4'>PRODUCT</div>
								<div className='col-span-2 text-right'>AMOUNT</div>
							</div>

							{ordersLoading && (
								<div className='flex items-center gap-2 bg-white px-4 py-4 text-sm font-bold text-slate-600'>
									<FiLoader className='animate-spin' />
									Loading recent orders...
								</div>
							)}

							{!ordersLoading && ordersError && (
								<div className='bg-white px-4 py-4 text-sm font-bold text-rose-700'>
									{ordersError}
								</div>
							)}

							{!ordersLoading &&
								!ordersError &&
								recentOrderRows.length === 0 && (
									<div className='bg-white px-4 py-6 text-sm font-bold text-slate-600'>
										No orders yet.
									</div>
								)}

							{!ordersLoading &&
								!ordersError &&
								recentOrderRows.map((row, idx, arr) => (
									<div
										key={row.id}
										className={clsx(
											'grid grid-cols-12 items-center bg-white px-4 py-4 text-sm',
											idx !== arr.length - 1 && 'border-b border-slate-200',
										)}
									>
										<Link
											href={`/admin/orders/${row.rawId}`}
											className='col-span-3 font-bold text-blue-600 hover:text-blue-700'
											title={`Created ${row.createdLabel}`}
										>
											{row.id}
										</Link>
										<div
											className='col-span-3 truncate font-bold text-slate-900'
											title={row.email}
										>
											{row.email}
										</div>
										<div
											className='col-span-4 truncate font-semibold text-slate-500'
											title={row.course}
										>
											{row.course}
										</div>
										<div className='col-span-2 text-right font-bold text-slate-900'>
											{row.amount}
										</div>
									</div>
								))}
						</div>
					</CardShell>
				</div>

				{/* Right column */}
				<div className='lg:col-span-4'>
					<div className='space-y-6'>
						{/* System Status (UPDATED to use /integrations/status) */}
						<div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
							<div className='border-b border-slate-200 px-5 py-4'>
								<div className='text-sm font-extrabold text-slate-900'>
									System Status
								</div>
							</div>

							<div className='space-y-4 p-5'>
								{intLoading && (
									<div className='flex items-center gap-2 text-sm font-bold text-slate-600'>
										<FiLoader className='animate-spin' />
										Loading integrations…
									</div>
								)}

								{!intLoading && intError && (
									<div className='text-sm font-bold text-rose-700'>
										{intError}
									</div>
								)}

								{!intLoading && !intError && (
									<>
										{/* Stripe */}
										<div className='flex items-center gap-3'>
											<div className='grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50'>
												<Image
													src='/stripe-logo.png'
													alt='Stripe'
													width={40}
													height={40}
													className='p-1'
												/>
											</div>

											<div className='min-w-0 flex-1'>
												<div className='text-sm font-extrabold text-slate-900'>
													Stripe
												</div>
												<div className='text-xs font-semibold text-slate-500'>
													Payments processing
												</div>
											</div>

											<div className='flex items-center gap-2'>
												<StatusDot status={stripeStatus} />
												<div className='text-xs font-extrabold text-slate-500'>
													{stripeStatus === 'connected'
														? 'Active'
														: stripeStatus === 'pending'
															? 'Pending'
															: 'Disconnected'}
												</div>
											</div>
										</div>

										{/* Moodle */}
										<div className='flex items-center gap-3'>
											<div className='grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50'>
												<Image
													src='/moodle-logo.webp'
													alt='Moodle'
													width={40}
													height={40}
													className='p-1'
												/>
											</div>

											<div className='min-w-0 flex-1'>
												<div className='text-sm font-extrabold text-slate-900'>
													Moodle LMS
												</div>
												<div className='text-xs font-semibold text-slate-500'>
													Course content sync
												</div>
											</div>

											<div className='flex items-center gap-2'>
												<StatusDot status={moodleStatus} />
												<div className='text-xs font-extrabold text-slate-500'>
													{moodleStatus === 'connected'
														? 'Active'
														: moodleStatus === 'pending'
															? 'Pending'
															: 'Disconnected'}
												</div>
											</div>
										</div>

										{/* Quick links */}
										<div className='pt-2'>
											<Link
												href='/admin/integrations'
												className='text-xs font-bold text-blue-600 hover:text-blue-700'
											>
												Manage integrations →
											</Link>
										</div>
									</>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Session card removed in your provided second version; add if you want */}
		</main>
	);
}
