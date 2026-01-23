'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
} from '@tanstack/react-table';

import {
	FiSearch,
	FiFilter,
	FiChevronDown,
	FiPlus,
	FiMoreHorizontal,
	FiTag,
	FiBox,
	FiEye,
	FiEdit2,
	FiArrowUp,
	FiArrowDown,
	FiLoader,
} from 'react-icons/fi';

import { api, qs } from '@/lib/api/api';
// ---------- Backend types (API response) ----------
export type ApiCategory = {
	id: number;
	name: string;
	slug: string;
};

export type ApiProductItem = {
	id: number;
	tenant_id: number;
	slug: string;
	title: string;
	description: string | null;
	image_url: string | null;
	price: string; // decimal string
	discounted_price: string | null;
	price_cents: number;
	currency: string; // e.g. "usd"
	is_published: boolean;
	identifier: string | null;
	stock_status: 'available' | 'not_available';
	created_at: string; // "2026-01-22 04:30:03.161206+00:00"
	categories: ApiCategory[];
};

export type ProductsPagedResponse = {
	ok: boolean;
	tenant_id: number;
	page: number;
	page_size: number;
	total: number;
	total_pages: number;
	items: ApiProductItem[];
};

// ---------- UI types (what the table renders) ----------
export type ProductStatus = 'published' | 'draft' | 'archived';

export type Product = {
	id: string;
	title: string;
	sku: string; // mapped from identifier for now
	category: string; // mapped from categories[0]?.name or "Uncategorized"
	price: string; // formatted string for UI (e.g. "$12.00")
	stock: 'available' | 'not_available'; // mapped from stock_status
	status: ProductStatus; // derived from is_published for now
	updatedAt: string; // derived from created_at (or updated_at if you add it)
	is_published: boolean;
	imageUrl?: string | null; // optional: handy for later UI
};

function clsx(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(' ');
}

function Pill({
	variant,
	children,
}: {
	variant: 'green' | 'slate' | 'amber' | 'rose' | 'blue';
	children: React.ReactNode;
}) {
	return (
		<span
			className={clsx(
				'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold',
				variant === 'green' && 'bg-emerald-50 text-emerald-700',
				variant === 'slate' && 'bg-slate-100 text-slate-700',
				variant === 'amber' && 'bg-amber-50 text-amber-700',
				variant === 'rose' && 'bg-rose-50 text-rose-700',
				variant === 'blue' && 'bg-blue-50 text-blue-700',
			)}
		>
			<span
				className={clsx(
					'h-1.5 w-1.5 rounded-full',
					variant === 'green' && 'bg-emerald-500',
					variant === 'slate' && 'bg-slate-400',
					variant === 'amber' && 'bg-amber-500',
					variant === 'rose' && 'bg-rose-500',
					variant === 'blue' && 'bg-blue-500',
				)}
			/>
			{children}
		</span>
	);
}

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
			<div className='flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between'>
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

/** Mapping backend item -> your Product shape */
function formatPriceUSD(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'number') {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
		}).format(value);
	}
	return '$0.00';
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

function mapApiItemToProduct(item: ApiProductItem): Product {
	const title = item.title ?? 'Untitled';
	const sku = item.identifier ?? '—'; // if you want SKU to be identifier
	const is_published = item.is_published ?? false;

	const category = item.categories?.[0]?.name
		? item.categories[0].name
		: 'Uncategorized';

	const stock: Product['stock'] = item.stock_status;

	const updatedRaw = item.created_at; // your endpoint provides created_at (no updated_at here)

	return {
		id: String(item.id),
		title: String(title),
		sku: String(sku),
		category: String(category),
		price: formatPriceUSD(item.price),
		stock,
		status: is_published ? 'published' : 'draft',
		updatedAt:
			typeof updatedRaw === 'string' ? relativeTimeFromISO(updatedRaw) : '—',
		is_published,
	};
}

function SortIcon({ dir }: { dir: false | 'asc' | 'desc' }) {
	if (dir === 'asc') return <FiArrowUp className='text-slate-400' />;
	if (dir === 'desc') return <FiArrowDown className='text-slate-400' />;
	return <span className='h-4 w-4' />;
}

function colWidthClass(id: string) {
	switch (id) {
		case 'title':
			return 'w-[40%]';
		case 'category':
			return 'w-[20%]';
		case 'price':
			return 'w-[15%]';
		case 'statusBlock':
			return 'w-[15%]';
		case 'updatedAt':
			return 'w-[10%]';
		case 'actions':
			return 'w-[10%]';
		default:
			return '';
	}
}

export default function AdminProductsPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// API paging (server paging)
	const [page, setPage] = useState(1);
	const pageSize = 12;
	const [totalPages, setTotalPages] = useState(1);

	// UI state
	const [search, setSearch] = useState('');
	const [sorting, setSorting] = useState<SortingState>([
		{ id: 'updatedAt', desc: true },
	]);

	const [data, setData] = useState<Product[]>([]);

	useEffect(() => {
		let cancelled = false;

		async function load() {
			setLoading(true);
			setError(null);

			try {
				const res = await api<ProductsPagedResponse>(
					`/products/paged` +
						qs({
							page,
							page_size: pageSize,
							published_only: false,
							include_categories: true,
						}),
					{ cache: 'no-store' },
				);

				if (cancelled) return;

				const products = (res.items ?? []).map(mapApiItemToProduct);
				setData(products);
				setTotalPages(res.total_pages ?? 1);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (e: any) {
				if (cancelled) return;
				setError(e?.message ?? 'Failed to load products');
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, [page]);

	const columns = useMemo<ColumnDef<Product>[]>(
		() => [
			{
				accessorKey: 'title',
				header: ({ column }) => {
					const dir = column.getIsSorted();
					return (
						<button
							onClick={() => column.toggleSorting(dir === 'asc')}
							className='flex w-full items-center justify-between gap-2 text-left'
						>
							<span>PRODUCT</span>
							<SortIcon dir={dir} />
						</button>
					);
				},
				cell: ({ row }) => {
					const p = row.original;
					return (
						<div className='flex items-start gap-3'>
							<div className='grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50'>
								<FiBox className='text-slate-500' />
							</div>
							<div className='min-w-0'>
								<div className='truncate font-extrabold text-slate-900'>
									{p.title}
								</div>
								<div className='mt-0.5 flex items-center gap-2 text-xs font-semibold text-slate-500'>
									<span className='inline-flex items-center gap-1'>
										<FiTag />
										{p.sku}
									</span>
									<span className='text-slate-300'>•</span>
									<span className='text-slate-500'>ID: {p.id}</span>
								</div>
							</div>
						</div>
					);
				},
				enableSorting: true,
			},
			{
				accessorKey: 'category',
				header: ({ column }) => {
					const dir = column.getIsSorted();
					return (
						<button
							onClick={() => column.toggleSorting(dir === 'asc')}
							className='flex w-full items-center justify-between gap-2 text-left'
						>
							<span>CATEGORY</span>
							<SortIcon dir={dir} />
						</button>
					);
				},
				cell: ({ getValue }) => (
					<div className='font-bold text-slate-700'>{String(getValue())}</div>
				),
			},
			{
				accessorKey: 'price',
				header: ({ column }) => {
					const dir = column.getIsSorted();
					return (
						<button
							onClick={() => column.toggleSorting(dir === 'asc')}
							className='flex w-full items-center justify-between gap-2 text-left'
						>
							<span>PRICE</span>
							<SortIcon dir={dir} />
						</button>
					);
				},
				cell: ({ getValue }) => (
					<div className='font-extrabold text-slate-900'>
						{String(getValue())}
					</div>
				),
			},
			{
				id: 'statusBlock',
				header: () => <span>STATUS</span>,
				cell: ({ row }) => {
					const p = row.original;
					return (
						<div className='flex flex-wrap items-center gap-2'>
							{p.is_published ? (
								<Pill variant='green'>Published</Pill>
							) : (
								<Pill variant='amber'>Not Published</Pill>
							)}
						</div>
					);
				},
				enableSorting: false,
			},
			{
				accessorKey: 'updatedAt',
				header: ({ column }) => {
					const dir = column.getIsSorted();
					return (
						<button
							onClick={() => column.toggleSorting(dir === 'asc')}
							className='flex w-full items-center justify-end gap-2'
						>
							<span>UPDATED</span>
							<SortIcon dir={dir} />
						</button>
					);
				},
				cell: ({ getValue }) => (
					<div className='text-right text-xs font-bold text-slate-500'>
						{String(getValue())}
					</div>
				),
			},
			{
				id: 'actions',
				header: () => <div className='text-right'>ACTIONS</div>,
				cell: ({ row }) => {
					const p = row.original;
					return (
						<div className='flex justify-end gap-2'>
							<Link
								href={`/admin/products/${p.id}`}
								className='inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50'
								aria-label='Edit'
							>
								<FiEdit2 />
							</Link>
							<button
								className='inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50'
								aria-label='More'
							>
								<FiMoreHorizontal />
							</button>
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
		state: {
			sorting,
			globalFilter: search,
		},
		onSortingChange: setSorting,
		onGlobalFilterChange: setSearch,
		globalFilterFn: (row, _columnId, filterValue) => {
			const q = String(filterValue ?? '')
				.toLowerCase()
				.trim();
			if (!q) return true;
			const p = row.original;
			return (
				p.title.toLowerCase().includes(q) ||
				p.sku.toLowerCase().includes(q) ||
				p.category.toLowerCase().includes(q) ||
				p.id.toLowerCase().includes(q)
			);
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	});

	const canPrev = page > 1;
	const canNext = page < totalPages;

	return (
		<main className='mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8'>
			{/* Header */}
			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<div>
					<h1 className='text-2xl font-extrabold tracking-tight'>Products</h1>
					<p className='mt-1 text-sm font-medium text-slate-500'>
						Manage products, pricing, and publishing status.
					</p>
				</div>

				<div className='flex items-center gap-2'>
					<Link href='/admin/products/new'>
						<button className='inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700 cursor-pointer'>
							<FiPlus />
							New Product
						</button>
					</Link>
				</div>
			</div>

			{/* Main card */}
			<div className='mt-6'>
				<CardShell
					title='Products'
					subtitle='Search, filter, and manage your products.'
					right={
						<div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center'>
							<div className='flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 shadow-sm sm:w-[360px]'>
								<FiSearch className='text-slate-400' />
								<input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className='w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400'
									placeholder='Search products by name or SKU...'
								/>
							</div>

							<button className='inline-flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50 sm:w-[170px]'>
								<span>Status: All</span>
								<FiChevronDown className='text-slate-400' />
							</button>
						</div>
					}
				>
					{/* Loading / error */}
					{loading && (
						<div className='flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-extrabold text-slate-700'>
							<FiLoader className='animate-spin' />
							Loading products...
						</div>
					)}

					{!loading && error && (
						<div className='rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700'>
							{error}
						</div>
					)}

					{/* Desktop table (TanStack -> real table) */}
					{!loading && !error && (
						<>
							<div className='hidden lg:block'>
								<div className='overflow-hidden rounded-xl border border-slate-200 bg-white'>
									<div className='overflow-x-auto'>
										<table className='min-w-full table-fixed'>
											<thead className='bg-slate-50'>
												{table.getHeaderGroups().map((headerGroup) => (
													<tr
														key={headerGroup.id}
														className='border-b border-slate-200'
													>
														{headerGroup.headers.map((header) => {
															const id = header.column.id;
															const isRight =
																id === 'updatedAt' || id === 'actions';
															return (
																<th
																	key={header.id}
																	scope='col'
																	className={clsx(
																		'px-4 py-3 text-[11px] font-extrabold tracking-wider text-slate-500',
																		isRight ? 'text-right' : 'text-left',
																		colWidthClass(id),
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
																	No products found
																</div>
																<div className='mt-1 text-xs font-semibold text-slate-500'>
																	Try a different search.
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
																	id === 'updatedAt' || id === 'actions';
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

							{/* Mobile cards (same data) */}
							<div className='space-y-3 lg:hidden'>
								{table.getRowModel().rows.length === 0 ? (
									<div className='rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm'>
										<div className='text-sm font-extrabold text-slate-900'>
											No products found
										</div>
										<div className='mt-1 text-xs font-semibold text-slate-500'>
											Try a different search.
										</div>
									</div>
								) : (
									table.getRowModel().rows.map((row) => {
										const p = row.original;
										return (
											<div
												key={p.id}
												className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
											>
												<div className='flex items-start justify-between gap-3'>
													<div className='flex items-start gap-3'>
														<div className='grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50'>
															<FiBox className='text-slate-500' />
														</div>
														<div className='min-w-0'>
															<div className='truncate text-sm font-extrabold text-slate-900'>
																{p.title}
															</div>
															<div className='mt-1 text-xs font-semibold text-slate-500'>
																{p.category} • {p.sku}
															</div>
														</div>
													</div>

													<button
														className='inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
														aria-label='More'
													>
														<FiMoreHorizontal />
													</button>
												</div>

												<div className='mt-3 flex flex-wrap items-center gap-2'>
													{p.is_published ? (
														<Pill variant='green'>Published</Pill>
													) : (
														<Pill variant='amber'>Not Published</Pill>
													)}
												</div>

												<div className='mt-3 flex items-center justify-between'>
													<div className='text-sm font-extrabold text-slate-900'>
														{p.price}
													</div>
													<div className='text-xs font-bold text-slate-500'>
														Updated {p.updatedAt}
													</div>
												</div>

												<div className='mt-4 grid grid-cols-3 gap-2'>
													<Link
														href={`/admin/products/${p.id}`}
														className='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50'
													>
														<FiEye />
														View
													</Link>
													<Link
														href={`/admin/products/${p.id}`}
														className='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50'
													>
														<FiEdit2 />
														Edit
													</Link>
													<button className='inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50'>
														<FiEdit2 />
														Archive
													</button>
												</div>
											</div>
										);
									})
								)}
							</div>

							{/* Pagination */}
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
										disabled={!canPrev}
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										className={clsx(
											'rounded-xl border px-4 py-2 text-sm font-extrabold shadow-sm',
											canPrev
												? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer'
												: 'cursor-not-allowed border-slate-200 bg-white text-slate-400',
										)}
									>
										Previous
									</button>

									<button
										disabled={!canNext}
										onClick={() => setPage((p) => p + 1)}
										className={clsx(
											'rounded-xl border px-4 py-2 text-sm font-extrabold shadow-sm',
											canNext
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
