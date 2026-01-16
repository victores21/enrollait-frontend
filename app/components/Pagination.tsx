import Link from 'next/link';

type PageItem = number | '…';

function PageLink({
	page,
	currentPage,
	children,
	disabled,
	basePath = '/',
}: {
	page: number;
	currentPage: number;
	children: React.ReactNode;
	disabled?: boolean;
	basePath?: string;
}) {
	const isActive = page === currentPage;

	if (disabled) {
		return (
			<span className='grid h-9 min-w-9 place-items-center rounded-md bg-white px-3 font-semibold text-gray-300 ring-1 ring-black/5'>
				{children}
			</span>
		);
	}

	return (
		<Link
			href={`${basePath}?page=${page}`}
			className={[
				'grid h-9 min-w-9 place-items-center rounded-md px-3',
				isActive
					? 'bg-[var(--primary)] font-bold text-white'
					: 'bg-white font-semibold text-gray-700 shadow-sm ring-1 ring-black/5 hover:bg-gray-50',
			].join(' ')}
			aria-current={isActive ? 'page' : undefined}
		>
			{children}
		</Link>
	);
}

// Compact pagination: [1] … [p-1 p p+1] … [N]
function getPageItems(current: number, total: number): PageItem[] {
	if (total <= 1) return [1];

	const items: PageItem[] = [];
	const clamp = (n: number) => Math.max(1, Math.min(total, n));
	const c = clamp(current);

	const windowStart = Math.max(2, c - 1);
	const windowEnd = Math.min(total - 1, c + 1);

	items.push(1);

	if (windowStart > 2) items.push('…');

	for (let p = windowStart; p <= windowEnd; p++) items.push(p);

	if (windowEnd < total - 1) items.push('…');

	if (total > 1) items.push(total);

	return items;
}

export default function Pagination({
	currentPage,
	totalPages,
	basePath = '/',
}: {
	currentPage: number;
	totalPages: number;
	basePath?: string;
}) {
	if (totalPages <= 1) return null;

	const canPrev = currentPage > 1;
	const canNext = currentPage < totalPages;
	const pageItems = getPageItems(currentPage, totalPages);

	return (
		<div className='mt-8 flex items-center justify-center gap-2 text-sm'>
			<PageLink
				page={currentPage - 1}
				currentPage={currentPage}
				disabled={!canPrev}
				basePath={basePath}
			>
				‹
			</PageLink>

			{pageItems.map((it, idx) =>
				it === '…' ? (
					<span key={`dots-${idx}`} className='px-2 text-gray-400'>
						…
					</span>
				) : (
					<PageLink
						key={it}
						page={it}
						currentPage={currentPage}
						basePath={basePath}
					>
						{it}
					</PageLink>
				)
			)}

			<PageLink
				page={currentPage + 1}
				currentPage={currentPage}
				disabled={!canNext}
				basePath={basePath}
			>
				›
			</PageLink>
		</div>
	);
}
