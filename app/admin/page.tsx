'use client';

import { FiAlertTriangle, FiCheckCircle, FiCircle } from 'react-icons/fi';
import { MeResponse } from '../types';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/api';

function clsx(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(' ');
}

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

export default function AdminDashboardPage() {
	const [me, setMe] = useState<MeResponse | null>(null);

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

				{/* <div className='flex items-center gap-3'>
					<Badge variant='green'>
						<span className='inline-block h-2 w-2 rounded-full bg-emerald-500' />
						Live Data
					</Badge>
					<a
						href='#'
						className='text-sm font-bold text-blue-600 hover:text-blue-700'
					>
						Customize Layout
					</a>
				</div> */}
			</div>

			{/* KPI cards */}
			<div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
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
			</div>

			{/* Two-column lower layout */}
			<div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12'>
				{/* Left: Recent Orders */}
				<div className='lg:col-span-8'>
					<CardShell
						title='Recent Orders'
						right={
							<a
								href='#'
								className='text-sm font-bold text-blue-600 hover:text-blue-700'
							>
								View All
							</a>
						}
					>
						<div className='overflow-hidden rounded-xl border border-slate-200'>
							<div className='grid grid-cols-12 bg-slate-50 px-4 py-3 text-[11px] font-extrabold tracking-wider text-slate-500'>
								<div className='col-span-3'>ORDER ID</div>
								<div className='col-span-3'>STUDENT</div>
								<div className='col-span-4'>COURSE</div>
								<div className='col-span-2 text-right'>AMOUNT</div>
							</div>

							{[
								{
									id: '#ORD-7721',
									student: 'Jane Doe',
									course: 'Advanced Python Mastery',
									amount: '$49.00',
								},
								{
									id: '#ORD-7720',
									student: 'Marcus Chen',
									course: 'Enterprise Architecture 101',
									amount: '$129.00',
								},
								{
									id: '#ORD-7719',
									student: 'Sarah Smith',
									course: 'UX Design Fundamentals',
									amount: '$89.00',
								},
								{
									id: '#ORD-7718',
									student: 'Alex Johnson',
									course: 'Data Science Bootcamp',
									amount: '$299.00',
								},
								{
									id: '#ORD-7717',
									student: 'Priya Patel',
									course: 'React for Beginners',
									amount: '$59.00',
								},
							].map((row, idx, arr) => (
								<div
									key={row.id}
									className={clsx(
										'grid grid-cols-12 items-center bg-white px-4 py-4 text-sm',
										idx !== arr.length - 1 && 'border-b border-slate-200',
									)}
								>
									<div className='col-span-3 font-bold text-blue-600'>
										{row.id}
									</div>
									<div className='col-span-3 font-bold text-slate-900'>
										{row.student}
									</div>
									<div className='col-span-4 truncate font-semibold text-slate-500'>
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
						{/* Enrollment Errors */}
						<div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
							<div className='flex items-center justify-between border-b border-slate-200 px-5 py-4'>
								<div className='flex items-center gap-2 text-sm font-extrabold text-rose-600'>
									<FiAlertTriangle />
									Enrollment Errors
								</div>
								<span className='inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-100 px-2 text-xs font-extrabold text-rose-700'>
									3
								</span>
							</div>

							<div className='space-y-4 p-5'>
								<div className='rounded-xl border border-slate-200 bg-white p-4'>
									<div className='flex items-start justify-between gap-3'>
										<div>
											<div className='text-sm font-extrabold text-slate-900'>
												Moodle Timeout
											</div>
											<div className='mt-1 text-xs font-semibold text-slate-500'>
												User ID: 442 • Course: Advanced Python
											</div>
										</div>
										<div className='text-xs font-bold text-slate-400'>
											10m ago
										</div>
									</div>

									<div className='mt-3 flex gap-2'>
										<button className='flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50'>
											View Logs
										</button>
										<button className='flex-1 rounded-xl bg-primary px-3 py-2 text-xs font-extrabold text-white hover:bg-blue-700'>
											Retry
										</button>
									</div>
								</div>

								<div className='rounded-xl border border-slate-200 bg-white p-4'>
									<div className='flex items-start justify-between gap-3'>
										<div>
											<div className='text-sm font-extrabold text-slate-900'>
												Payment Sync Failed
											</div>
											<div className='mt-1 text-xs font-semibold text-slate-500'>
												Order: #7719 • Integration: Stripe
											</div>
										</div>
										<div className='text-xs font-bold text-slate-400'>
											1h ago
										</div>
									</div>

									<div className='mt-3 flex gap-2'>
										<button className='flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50'>
											View Logs
										</button>
										<button className='flex-1 rounded-xl bg-primary px-3 py-2 text-xs font-extrabold text-white hover:bg-blue-700'>
											Retry
										</button>
									</div>
								</div>
							</div>
						</div>

						{/* System Status */}
						<div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
							<div className='border-b border-slate-200 px-5 py-4'>
								<div className='text-sm font-extrabold text-slate-900'>
									System Status
								</div>
							</div>

							<div className='space-y-4 p-5'>
								{[
									{
										name: 'Stripe',
										sub: 'Payments processing',
										status: 'Active',
										active: true,
										icon: <FiCheckCircle className='text-emerald-500' />,
									},
									{
										name: 'Moodle LMS',
										sub: 'Course content sync',
										status: 'Active',
										active: true,
										icon: <FiCheckCircle className='text-emerald-500' />,
									},
									{
										name: 'Mailchimp',
										sub: 'Marketing automation',
										status: 'Disconnected',
										active: false,
										icon: <FiCircle className='text-slate-300' />,
									},
								].map((s) => (
									<div key={s.name} className='flex items-center gap-3'>
										<div className='grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50'>
											{s.icon}
										</div>
										<div className='min-w-0 flex-1'>
											<div className='text-sm font-extrabold text-slate-900'>
												{s.name}
											</div>
											<div className='text-xs font-semibold text-slate-500'>
												{s.sub}
											</div>
										</div>
										<div className='flex items-center gap-2'>
											<span
												className={clsx(
													'h-2 w-2 rounded-full',
													s.active ? 'bg-emerald-500' : 'bg-slate-300',
												)}
											/>
											<div className='text-xs font-extrabold text-slate-500'>
												{s.status}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			<CardShell title='Your session'>
				<div className='mt-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm'>
					<div className='font-extrabold text-slate-900'>
						{me?.email ?? '-'}
					</div>
					<div className='mt-1 text-xs font-semibold text-slate-500'>
						role: {me?.role ?? '-'} • tenant_id: {me?.tenant_id ?? '-'}
					</div>
				</div>
			</CardShell>
		</main>
	);
}
