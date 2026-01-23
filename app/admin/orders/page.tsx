'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';

import {
	FiSearch,
	FiChevronDown,
	FiEye,
	FiArrowUp,
	FiArrowDown,
	FiLoader,
	FiCheckCircle,
	FiClock,
	FiXCircle,
	FiCreditCard,
} from 'react-icons/fi';

import { api, qs } from '@/lib/api/api';
import clsx from '@/lib/clsx';
import { Pill } from '@/app/components/Pill';

// ---------- Backend types (API response) ----------
export type ApiOrderItem = {
	id: number;
	tenant_id: number;
	product_id: number | null;
	buyer_email: string | null;
	stripe_session_id: string | null;
	status: 'pending' | 'paid' | 'fulfilled' | 'expired' | string;
	created_at: string;
	total_cents: number | null;

	// OPTIONAL (if your orders endpoint joins products)
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

// ---------- UI types ----------
export type OrderStatus =
	| 'pending'
	| 'paid'
	| 'fulfilled'
	| 'expired'
	| 'other';

export type OrderRow = {
	id: string;
	email: string;
	total: string;
	status: OrderStatus;
	dateRaw: string;
	dateLabel: string;
	raw: ApiOrderItem;
};

function CardShell({
	title,
	subtitle,
	right,
	children,
}: {
	title: string;
	subtitle?: string;
	right?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
			<div className='flex flex-col flex-wrap gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<div className='text-sm font-extrabold text-slate-900'>{title}</div>
					{subtitle && (
						<div className='mt-1 text-xs font-semibold text-slate-500'>
							{subtitle}
						</div>
					)}
				</div>
				{right}
			</div>
			<div className='p-5'>{children}</div>
		</div>
	);
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

function SortIcon({ dir }: { dir: false | 'asc' | 'desc' }) {
	if (dir === 'asc') return <FiArrowUp className='text-slate-400' />;
	if (dir === 'desc') return <FiArrowDown className='text-slate-400' />;
	return <span className='h-4 w-4' />;
}

function truncateMiddle(value: string, keepStart = 6, keepEnd = 10) {
	if (!value) return '—';
	if (value.length <= keepStart + keepEnd + 3) return value;
	return `${value.slice(0, keepStart)}…${value.slice(-keepEnd)}`;
}

function EmailCell({ email }: { email: string }) {
	if (!email || email === '—') return <span className='text-slate-400'>—</span>;
	return (
		<span
			title={email}
			className='inline-flex max-w-[220px] truncate font-bold text-slate-700'
		>
			{truncateMiddle(email, 6, 14)}
		</span>
	);
}

/** Map backend item -> UI row */
function mapApiItemToOrderRow(item: ApiOrderItem): OrderRow {
	const status = normalizeStatus(item.status);
	const currency = item.product?.currency ?? 'usd';
	const total = formatMoneyFromCents(item.total_cents, currency);
	const email = (item.buyer_email || '').trim().toLowerCase() || '—';

	return {
		id: String(item.id),
		email,
		status,
		total,
		dateRaw: String(item.created_at ?? ''),
		dateLabel: relativeTimeFromISO(item.created_at),
		raw: item,
	};
}

// -------- UI filter state --------
type StatusFilter = 'all' | 'pending' | 'paid' | 'fulfilled' | 'expired';

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
	{ value: 'all', label: 'All' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'paid', label: 'Paid' },
	{ value: 'fulfilled', label: 'Fulfilled' },
	{ value: 'expired', label: 'Expired' },
];

export default function AdminOrdersPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// pagination
	const [page, setPage] = useState(1);
	const pageSize = 12;
	const [totalPages, setTotalPages] = useState(1);

	// server filters
	const [searchInput, setSearchInput] = useState(''); // what user types
	const [searchQ, setSearchQ] = useState(''); // what we actually send to API (debounced/committed)
	const [status, setStatus] = useState<StatusFilter>('all');

	// table UI state (sorting only, no local filtering)
	const [sorting, setSorting] = useState<SortingState>([
		{ id: 'date', desc: true },
	]);

	const [data, setData] = useState<OrderRow[]>([]);

	// ✅ hydration-safe col widths
	const colWidths = useMemo(
		() => ['28%', '22%', '16%', '16%', '14%', '4%'],
		[],
	);

	// Debounce search input -> server query
	useEffect(() => {
		const t = setTimeout(() => {
			setPage(1); // search should restart pagination
			setSearchQ(searchInput.trim());
		}, 350);

		return () => clearTimeout(t);
	}, [searchInput]);

	// When status changes -> reset to page 1
	useEffect(() => {
		setPage(1);
	}, [status]);

	// Server fetch: runs on every pagination/filter change
	useEffect(() => {
		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);

			try {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const query: Record<string, any> = {
					page,
					page_size: pageSize,
					include_product: true,
				};

				// status filter (endpoint uses status=None for "all")
				if (status !== 'all') query.status = status;

				// q search
				if (searchQ) query.q = searchQ;

				const res = await api<OrdersPagedResponse>(
					`/orders/paged` + qs(query),
					{ cache: 'no-store' },
				);

				if (cancelled) return;

				setData((res.items ?? []).map(mapApiItemToOrderRow));
				setTotalPages(res.total_pages ?? 1);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (e: any) {
				if (cancelled) return;
				setError(e?.message ?? 'Failed to load orders');
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [page, pageSize, status, searchQ]);

	const columns = useMemo<ColumnDef<OrderRow>[]>(
		() => [
			{
				id: 'order',
				header: ({ column }) => {
					const dir = column.getIsSorted();
					return (
						<button
							onClick={() => column.toggleSorting(dir === 'asc')}
							className='flex w-full items-center justify-between gap-2 text-left'
						>
							<span>ORDER</span>
							<SortIcon dir={dir} />
						</button>
					);
				},
				cell: ({ row }) => {
					const o = row.original;
					return (
						<div className='flex min-w-0 items-center gap-3'>
							<div className='grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50'>
								<StatusIcon status={o.status} />
							</div>
							<div className='min-w-0'>
								<div className='truncate font-extrabold text-slate-900'>
									Order #{o.id}
								</div>
								<div className='mt-0.5 text-xs font-semibold text-slate-500'>
									ID: {o.id}
								</div>
							</div>
						</div>
					);
				},
				enableSorting: true,
				sortingFn: (a, b) => Number(a.original.id) - Number(b.original.id),
			},
			{
				id: 'email',
				header: () => <span>EMAIL</span>,
				accessorFn: (row) => row.email,
				cell: ({ row }) => <EmailCell email={row.original.email} />,
				enableSorting: false, // server-driven; keep UI simple
			},
			{
				id: 'date',
				header: ({ column }) => {
					const dir = column.getIsSorted();
					return (
						<button
							onClick={() => column.toggleSorting(dir === 'asc')}
							className='flex w-full items-center justify-end gap-2'
						>
							<span>DATE</span>
							<SortIcon dir={dir} />
						</button>
					);
				},
				accessorFn: (row) => row.dateRaw,
				cell: ({ row }) => (
					<div className='text-right text-xs font-bold text-slate-500'>
						{row.original.dateLabel}
					</div>
				),
			},
			{
				id: 'status',
				header: () => <span>STATUS</span>,
				accessorFn: (row) => row.status,
				cell: ({ row }) => (
					<div className='flex items-center'>
						<StatusPill status={row.original.status} />
					</div>
				),
				enableSorting: false,
			},
			{
				id: 'total',
				header: () => <span className='flex w-full justify-end'>TOTAL</span>,
				accessorFn: (row) => row.total,
				cell: ({ row }) => (
					<div className='text-right font-extrabold text-slate-900'>
						{row.original.total}
					</div>
				),
				enableSorting: false,
			},
			{
				id: 'actions',
				header: () => <div className='text-right'> </div>,
				cell: ({ row }) => {
					const o = row.original;
					return (
						<div className='flex justify-end'>
							<Link
								href={`/admin/orders/${o.id}`}
								className='inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50'
								aria-label='View'
							>
								<FiEye />
							</Link>
						</div>
					);
				},
			},
		],
		[],
	);

	const table = useReactTable({
		data,
		columns,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	const canPrev = page > 1;
	const canNext = page < totalPages;

	// Status dropdown UI state
	const [statusOpen, setStatusOpen] = useState(false);
	const statusLabel =
		STATUS_OPTIONS.find((o) => o.value === status)?.label ?? 'All';

	return (
		<main className='mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8'>
			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<h1 className='text-2xl font-extrabold tracking-tight'>Orders</h1>
					<p className='mt-1 text-sm font-medium text-slate-500'>
						Search and inspect orders created by Stripe checkout.
					</p>
				</div>
			</div>

			<div className='mt-6'>
				<CardShell
					title='Orders'
					subtitle='Search and inspect orders.'
					right={
						<div className='flex w-full flex-wrap flex-col gap-2 sm:w-auto sm:flex-row sm:items-center'>
							{/* Search -> hits endpoint (debounced) */}
							<div className='flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 shadow-sm sm:w-[440px]'>
								<FiSearch className='text-slate-400' />
								<input
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									className='w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400'
									placeholder='Search: id, email, status, stripe id, date (YYYY-MM-DD)...'
								/>
							</div>

							{/* Status dropdown -> hits endpoint */}
							<div className='relative'>
								<button
									type='button'
									onClick={() => setStatusOpen((v) => !v)}
									className='inline-flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-[170px]'
								>
									<span>Status: {statusLabel}</span>
									<FiChevronDown className='text-slate-400' />
								</button>

								{statusOpen && (
									<div
										className='absolute right-0 z-20 mt-2 w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg'
										role='menu'
									>
										{STATUS_OPTIONS.map((opt) => (
											<button
												key={opt.value}
												className={clsx(
													'w-full px-3 py-2 text-left text-sm font-bold hover:bg-slate-50',
													opt.value === status && 'bg-slate-50 text-slate-900',
												)}
												onClick={() => {
													setStatus(opt.value);
													setStatusOpen(false);
												}}
											>
												{opt.label}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					}
				>
					{loading && (
						<div className='flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700'>
							<FiLoader className='animate-spin' />
							Loading orders...
						</div>
					)}

					{!loading && error && (
						<div className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700'>
							{error}
						</div>
					)}

					{!loading && !error && (
						<>
							<div className='hidden lg:block'>
								<div className='overflow-hidden rounded-xl border border-slate-200 bg-white'>
									<div className='overflow-x-auto'>
										<table className='min-w-full table-fixed'>
											<colgroup>
												{colWidths.map((w, i) => (
													<col key={w + i} style={{ width: w }} />
												))}
											</colgroup>

											<thead className='bg-slate-50'>
												{table.getHeaderGroups().map((headerGroup) => (
													<tr
														key={headerGroup.id}
														className='border-b border-slate-200'
													>
														{headerGroup.headers.map((header) => {
															const id = header.column.id;
															const isRight =
																id === 'date' ||
																id === 'total' ||
																id === 'actions';
															return (
																<th
																	key={header.id}
																	scope='col'
																	className={clsx(
																		'px-4 py-3 text-[11px] font-extrabold tracking-wider text-slate-500',
																		isRight ? 'text-right' : 'text-left',
																	)}
																>
																	{header.isPlaceholder
																		? null
																		: flexRender(
																				header.column.columnDef.header,
																				header.getContext(),
																			)}
																</th>
															);
														})}
													</tr>
												))}
											</thead>

											<tbody className='divide-y divide-slate-200'>
												{table.getRowModel().rows.length === 0 ? (
													<tr>
														<td
															colSpan={table.getAllLeafColumns().length}
															className='px-4 py-10'
														>
															<div className='text-center'>
																<div className='text-sm font-extrabold text-slate-900'>
																	No orders found
																</div>
																<div className='mt-1 text-xs font-semibold text-slate-500'>
																	Try a different search or status filter.
																</div>
															</div>
														</td>
													</tr>
												) : (
													table.getRowModel().rows.map((row) => (
														<tr key={row.id} className='hover:bg-slate-50/60'>
															{row.getVisibleCells().map((cell) => {
																const id = cell.column.id;
																const isRight =
																	id === 'date' ||
																	id === 'total' ||
																	id === 'actions';
																return (
																	<td
																		key={cell.id}
																		className={clsx(
																			'px-4 py-4 align-middle text-sm',
																			isRight ? 'text-right' : 'text-left',
																		)}
																	>
																		{flexRender(
																			cell.column.columnDef.cell,
																			cell.getContext(),
																		)}
																	</td>
																);
															})}
														</tr>
													))
												)}
											</tbody>
										</table>
									</div>
								</div>
							</div>

							{/* Mobile */}
							<div className='space-y-3 lg:hidden'>
								{table.getRowModel().rows.length === 0 ? (
									<div className='rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm'>
										<div className='text-sm font-extrabold text-slate-900'>
											No orders found
										</div>
										<div className='mt-1 text-xs font-semibold text-slate-500'>
											Try a different search or status filter.
										</div>
									</div>
								) : (
									table.getRowModel().rows.map((row) => {
										const o = row.original;
										return (
											<div
												key={o.id}
												className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
											>
												<div className='flex items-start justify-between gap-3'>
													<div className='flex items-start gap-3'>
														<div className='grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50'>
															<StatusIcon status={o.status} />
														</div>
														<div className='min-w-0'>
															<div className='truncate text-sm font-extrabold text-slate-900'>
																Order #{o.id}
															</div>
															<div className='mt-1 text-xs font-semibold text-slate-500'>
																<span title={o.email} className='cursor-help'>
																	{truncateMiddle(o.email, 6, 14)}
																</span>
																<span className='mx-2 text-slate-300'>•</span>
																Created {o.dateLabel}
															</div>
														</div>
													</div>

													<Link
														href={`/admin/orders/${o.id}`}
														className='inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
														aria-label='View'
													>
														<FiEye />
													</Link>
												</div>

												<div className='mt-3 flex flex-wrap items-center gap-2'>
													<StatusPill status={o.status} />
												</div>

												<div className='mt-3 flex items-center justify-between'>
													<div className='text-sm font-extrabold text-slate-900'>
														{o.total}
													</div>
													<div className='text-xs font-bold text-slate-500'>
														{String(o.status).toUpperCase()}
													</div>
												</div>
											</div>
										);
									})
								)}
							</div>

							{/* Pagination (always hits endpoint) */}
							<div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
								<div className='text-sm font-semibold text-slate-600'>
									Page{' '}
									<span className='font-extrabold text-slate-900'>{page}</span>{' '}
									of{' '}
									<span className='font-extrabold text-slate-900'>
										{totalPages}
									</span>
								</div>

								<div className='flex items-center gap-2'>
									<button
										disabled={!canPrev || loading}
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										className={clsx(
											'rounded-xl border px-4 py-2 text-sm font-extrabold shadow-sm',
											canPrev && !loading
												? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer'
												: 'cursor-not-allowed border-slate-200 bg-white text-slate-400',
										)}
									>
										Previous
									</button>

									<button
										disabled={!canNext || loading}
										onClick={() => setPage((p) => p + 1)}
										className={clsx(
											'rounded-xl border px-4 py-2 text-sm font-extrabold shadow-sm',
											canNext && !loading
												? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer'
												: 'cursor-not-allowed border-slate-200 bg-white text-slate-400',
										)}
									>
										Next
									</button>
								</div>
							</div>
						</>
					)}
				</CardShell>
			</div>
		</main>
	);
}
