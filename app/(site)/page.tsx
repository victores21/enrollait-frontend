export const dynamic = 'force-dynamic';

import { api, qs } from '@/lib/api/api';
import { ProductsPagedResponse } from '../types';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';

export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ page?: string }>;
}) {
	const sp = await searchParams;

	const page = Math.max(1, Number(sp.page ?? '1') || 1);
	const pageSize = 12;

	const courses = await api<ProductsPagedResponse>(
		`/products/paged` +
			qs({
				page,
				page_size: pageSize,
				published_only: true,
				include_categories: true,
			}),
		{ cache: 'no-store' }
	);

	return (
		<div className=''>
			<div className='mt-8'>
				<h1 className='text-3xl font-extrabold tracking-tight'>
					Browse courses
				</h1>
				<p className='mt-1 text-sm text-gray-500'>
					Buy and enroll instantly. Expand your skills today.
				</p>
			</div>

			{/* Grid */}
			<div className='mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
				{courses.items.map((c) => (
					<ProductCard key={c.id} product={c} />
				))}
			</div>

			{/* Pagination */}
			<Pagination
				currentPage={courses?.page}
				totalPages={courses?.total_pages}
				basePath='/'
			/>
		</div>
	);
}
