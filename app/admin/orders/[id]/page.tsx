'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
	FiArrowLeft,
	FiLoader,
	FiCreditCard,
	FiCheckCircle,
	FiClock,
	FiXCircle,
} from 'react-icons/fi';

import { api, qs } from '@/lib/api/api';
import { Pill } from '@/app/components/Pill';
import CardShell from '@/app/components/CardShell';

type OrderDetailProduct = {
	slug: string | null;
	title: string | null;
	image_url: string | null;
	price: string | null;
	discounted_price: string | null;
	currency: string | null;
};

type OrderDetailCategory = {
	id: number;
	name: string;
	slug: string;
	moodle_category_id: number | null;
};

type OrderDetailCourse = {
	id: number;
	moodle_course_id: number | null;
	fullname: string;
	summary: string | null;
};

type OrderEnrollment = {
	id: number;
	tenant_id: number | null;
	order_id: number | null;
	moodle_course_id: number | null;
	moodle_user_id: number | null;
	status: string;
	error: string | null;
	created_at: string;
};

type OrderDetail = {
	id: number;
	tenant_id: number | null;
	product_id: number | null;
	buyer_email: string | null;
	stripe_session_id: string | null;
	status: string;
	created_at: string;
	total_cents: number | null;

	product?: OrderDetailProduct;
	product_categories?: OrderDetailCategory[];
	product_courses?: OrderDetailCourse[];
	enrollments?: OrderEnrollment[];
};

type OrderDetailResponse = {
	ok: boolean;
	tenant_id: number;
	order: OrderDetail;
};

function truncateMiddle(value: string, keepStart = 10, keepEnd = 12) {
	if (!value) return '—';
	if (value.length <= keepStart + keepEnd + 3) return value;
	return `${value.slice(0, keepStart)}…${value.slice(-keepEnd)}`;
}

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

type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'expired' | 'other';

function normalizeStatus(s: unknown): OrderStatus {
	const v = String(s || '')
		.toLowerCase()
		.trim();
	if (v === 'pending') return 'pending';
	if (v === 'paid') return 'paid';
	if (v === 'fulfilled') return 'fulfilled';
	if (v === 'expired') return 'expired';
	return 'other';
}

function StatusPill({ status }: { status: OrderStatus }) {
	if (status === 'fulfilled') return <Pill variant='green'>Fulfilled</Pill>;
	if (status === 'paid') return <Pill variant='blue'>Paid</Pill>;
	if (status === 'pending') return <Pill variant='amber'>Pending</Pill>;
	if (status === 'expired') return <Pill variant='rose'>Expired</Pill>;
	return <Pill variant='slate'>Other</Pill>;
}

function StatusIcon({ status }: { status: OrderStatus }) {
	if (status === 'fulfilled')
		return <FiCheckCircle className='text-emerald-600' />;
	if (status === 'paid') return <FiCreditCard className='text-blue-600' />;
	if (status === 'pending') return <FiClock className='text-amber-600' />;
	if (status === 'expired') return <FiXCircle className='text-rose-600' />;
	return <FiClock className='text-slate-500' />;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className='rounded-2xl border border-slate-200 bg-white px-4 py-3'>
			<div className='text-[11px] font-bold tracking-wider text-slate-500'>
				{label}
			</div>
			<div className='mt-1 text-sm font-semibold text-slate-900'>{value}</div>
		</div>
	);
}

export default function AdminOrderDetailPage() {
	const params = useParams();
	const orderId = String(params?.id || '');

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [order, setOrder] = useState<OrderDetail | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);

			try {
				const query = {
					include_product: true,
					include_enrollments: true,
					include_product_courses: true,
					include_product_categories: true,
				};

				const res = await api<OrderDetailResponse>(
					`/orders/${orderId}` + qs(query),
					{ cache: 'no-store' },
				);

				if (cancelled) return;
				setOrder(res.order);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (e: any) {
				if (cancelled) return;
				setError(e?.message ?? 'Failed to load order');
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		if (orderId) load();
		return () => {
			cancelled = true;
		};
	}, [orderId]);

	const status = useMemo(() => normalizeStatus(order?.status), [order?.status]);
	const currency = order?.product?.currency ?? 'usd';
	const totalLabel = formatMoneyFromCents(order?.total_cents, currency);

	return (
		<main className='mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<div className='flex items-center gap-3'>
						<Link
							href='/admin/orders'
							className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50'
						>
							<FiArrowLeft />
							Back
						</Link>

						<h1 className='text-2xl font-extrabold tracking-tight'>
							Order #{orderId}
						</h1>
					</div>
					<p className='mt-2 text-sm font-medium text-slate-500'>
						Order details, product context, and enrollment attempts.
					</p>
				</div>
			</div>

			<div className='mt-6 space-y-4'>
				{loading && (
					<div className='flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700'>
						<FiLoader className='animate-spin' />
						Loading order...
					</div>
				)}

				{!loading && error && (
					<div className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700'>
						{error}
					</div>
				)}

				{!loading && !error && order && (
					<>
						<CardShell
							title='Summary'
							subtitle='Core fields from orders table.'
							right={
								<div className='flex items-center gap-2'>
									<div className='grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50'>
										<StatusIcon status={status} />
									</div>
									<StatusPill status={status} />
								</div>
							}
						>
							<div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
								<Field label='Total' value={totalLabel} />
								<Field label='Buyer email' value={order.buyer_email || '—'} />
								<Field
									label='Created at'
									value={new Date(order.created_at).toLocaleString()}
								/>
								<Field
									label='Status'
									value={String(order.status || '—').toUpperCase()}
								/>
								<Field
									label='Stripe session'
									value={
										order.stripe_session_id ? (
											<span
												title={order.stripe_session_id}
												className='cursor-help'
											>
												{truncateMiddle(order.stripe_session_id, 10, 14)}
											</span>
										) : (
											'—'
										)
									}
								/>
								<Field label='Product ID' value={order.product_id ?? '—'} />
							</div>
						</CardShell>

						<CardShell
							title='Product'
							subtitle='Snapshot included via join (orders.product_id -> products).'
						>
							{order.product_id && order.product ? (
								<div className='flex flex-col gap-4 md:flex-row md:items-start'>
									<div className='h-28 w-28 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50'>
										{/* Using plain img to avoid Next Image config issues for remote domains */}
										{order.product.image_url ? (
											<img
												src={order.product.image_url}
												alt={order.product.title || 'Product'}
												className='h-full w-full object-cover'
											/>
										) : (
											<div className='grid h-full w-full place-items-center text-xs font-extrabold text-slate-400'>
												No image
											</div>
										)}
									</div>

									<div className='min-w-0 flex-1'>
										<div className='text-lg font-extrabold text-slate-900'>
											{order.product.title || '—'}
										</div>
										<div className='mt-1 text-sm font-semibold text-slate-500'>
											Slug:{' '}
											<span className='font-bold'>
												{order.product.slug || '—'}
											</span>
										</div>

										<div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3'>
											<Field
												label='Price'
												value={
													order.product.price
														? `${order.product.price} ${currency.toUpperCase()}`
														: '—'
												}
											/>
											<Field
												label='Discounted'
												value={
													order.product.discounted_price
														? `${order.product.discounted_price} ${currency.toUpperCase()}`
														: '—'
												}
											/>
											<Field label='Currency' value={currency.toUpperCase()} />
										</div>

										<div className='mt-4 grid grid-cols-1 gap-3 md:grid-cols-2'>
											<Field
												label='Categories'
												value={
													order.product_categories?.length ? (
														<div className='flex flex-wrap gap-2'>
															{order.product_categories.map((c) => (
																<span
																	key={c.id}
																	className='rounded-full bg-slate-100 px-2 py-1 text-xs font-extrabold text-slate-700'
																	title={`slug: ${c.slug}`}
																>
																	{c.name}
																</span>
															))}
														</div>
													) : (
														<span className='text-slate-400'>—</span>
													)
												}
											/>
											<Field
												label='Courses'
												value={
													order.product_courses?.length ? (
														<div className='space-y-2'>
															{order.product_courses.map((c) => (
																<div
																	key={c.id}
																	className='rounded-xl odd:border-b odd:border-slate-200 bg-white px-3 py-2'
																>
																	<div className='text-xs font-extrabold text-slate-900'>
																		{c.fullname}
																	</div>
																	<div className='mt-0.5 text-[11px] font-semibold text-slate-500'>
																		Moodle course id:{' '}
																		{c.moodle_course_id ?? '—'}
																	</div>
																</div>
															))}
														</div>
													) : (
														<span className='text-slate-400'>—</span>
													)
												}
											/>
										</div>
									</div>
								</div>
							) : (
								<div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700'>
									This order is not associated with a product.
								</div>
							)}
						</CardShell>

						<CardShell
							title='Enrollments'
							subtitle='Rows from order_enrollments for this order.'
						>
							{order.enrollments?.length ? (
								<div className='overflow-hidden rounded-2xl border border-slate-200'>
									<div className='overflow-x-auto'>
										<table className='min-w-full'>
											<thead className='bg-slate-50'>
												<tr className='border-b border-slate-200'>
													<th className='px-4 py-3 text-left text-[11px] font-extrabold tracking-wider text-slate-500'>
														MOODLE COURSE ID
													</th>
													<th className='px-4 py-3 text-left text-[11px] font-extrabold tracking-wider text-slate-500'>
														MOODLE USER ID
													</th>
													<th className='px-4 py-3 text-left text-[11px] font-extrabold tracking-wider text-slate-500'>
														STATUS
													</th>
													<th className='px-4 py-3 text-left text-[11px] font-extrabold tracking-wider text-slate-500'>
														CREATED
													</th>
													<th className='px-4 py-3 text-left text-[11px] font-extrabold tracking-wider text-slate-500'>
														ERROR
													</th>
												</tr>
											</thead>
											<tbody className='divide-y divide-slate-200'>
												{order.enrollments.map((e) => (
													<tr key={e.id} className='hover:bg-slate-50/60'>
														<td className='px-4 py-3 text-sm font-extrabold text-slate-900'>
															{e.moodle_course_id ?? '—'}
														</td>
														<td className='px-4 py-3 text-sm font-semibold text-slate-700'>
															{e.moodle_user_id ?? '—'}
														</td>
														<td className='px-4 py-3 text-sm font-extrabold text-slate-900'>
															<span className='rounded-full bg-slate-100 px-2 py-1 text-xs font-extrabold text-slate-700'>
																{String(e.status.toUpperCase() || '—')}
															</span>
														</td>
														<td className='px-4 py-3 text-xs font-semibold text-slate-500'>
															{new Date(e.created_at).toLocaleString()}
														</td>
														<td className='px-4 py-3 text-xs font-semibold text-slate-600'>
															{e.error ? (
																<span className='text-rose-700'>{e.error}</span>
															) : (
																<span className='text-slate-400'>—</span>
															)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							) : (
								<div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700'>
									No enrollments found for this order.
								</div>
							)}
						</CardShell>
					</>
				)}
			</div>
		</main>
	);
}
