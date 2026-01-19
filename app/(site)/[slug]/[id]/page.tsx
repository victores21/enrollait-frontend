export const dynamic = 'force-dynamic';

import { CourseContentAccordion } from '@/app/components/CourseContentAccordion';
import CoursePurchaseCard from '@/app/components/CoursePurchaseCard';
import { api, qs } from '@/lib/api/api';
import { FiCheck } from 'react-icons/fi';
import type { Category } from '@/app/types'; // adjust if needed

type PageProps = {
	params: Promise<{ slug: string; id: string }>;
};

// ---- Types for this endpoint ----
type ProductDetailResponse = {
	ok: boolean;
	product: ProductDetail;
};

type MoodleCourse = {
	moodle_course_id: number;
	fullname: string;
	summary: string; // HTML
};

type ProductDetail = {
	id: number;
	tenant_id: number;
	moodle_course_id: number;
	slug: string;
	title: string;
	description: string;
	price: string;
	image_url: string;
	discounted_price: string | null;
	price_cents: number;
	currency: string;
	is_published: boolean;
	identifier: string | null;
	stock_status: string;
	created_at: string;
	courses?: MoodleCourse[];
	related_products?: unknown[];
	categories?: Category[];
};

export default async function ProductPage({ params }: PageProps) {
	const { id } = await params;
	const productId = Number(id);

	// Fetch product detail
	const data = await api<ProductDetailResponse>(
		`/products/${productId}` +
			qs({
				include_courses: true,
				include_related: true,
				include_categories: true,
			}),
		{ cache: 'no-store' }
	);

	const product = data.product;

	// ---- Build a "course" object your UI can consume (minimal mapping) ----
	const courseForUI = {
		id: String(product.id),
		title: product.title,
		subtitle: product.description ?? '',
		learn: [
			'Instant access after purchase',
			'Learn at your own pace',
			'Includes course materials and updates',
			'Access on mobile and desktop',
		],
		// Map moodle courses into accordion modules
		modules: (product.courses ?? []).map((c) => ({
			title: c.fullname,
			meta: `Moodle course #${c.moodle_course_id}`,
			items: [
				{
					title: 'Overview',
					time: '—',
					// keep extra fields if your accordion supports it
					summaryHtml: c.summary,
				},
			],
		})),
		description: product.description ? [product.description] : [],
		prerequisites: '—',
	};

	// Prices for purchase card
	const price = Number(product.discounted_price ?? product.price);
	const oldPrice = product.discounted_price ? Number(product.price) : undefined;

	return (
		<main className='px-4 xl:px-0'>
			<div className='mx-auto w-full pt-4'>
				{/* Breadcrumbs */}
				<nav className='mb-4 text-xs text-slate-500'>
					<ol className='flex flex-wrap items-center gap-2'>
						<li className='hover:text-slate-700'>Home</li>
						<li className='text-slate-300'>/</li>
						<li className='hover:text-slate-700'>Courses</li>
						<li className='text-slate-300'>/</li>
						<li className='font-medium text-slate-700'>{product.title}</li>
					</ol>
				</nav>

				<div className='grid gap-8 lg:grid-cols-[1fr_360px]'>
					{/* Left */}
					<section className='min-w-0'>
						<h1 className='text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl'>
							{product.title}
						</h1>

						<p className='mt-3 max-w-2xl text-sm leading-6 text-slate-600'>
							{product.description}
						</p>

						{/* What you'll learn */}
						<div className='mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
							<h2 className='text-sm font-semibold text-slate-900'>
								What you&apos;ll learn
							</h2>

							<div className='mt-4 grid gap-3 sm:grid-cols-2'>
								{courseForUI.learn.map((item) => (
									<div key={item} className='flex gap-3'>
										<div className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100'>
											<FiCheck className='h-4 w-4 text-blue-600' />
										</div>
										<p className='text-sm leading-6 text-slate-700'>{item}</p>
									</div>
								))}
							</div>
						</div>

						{/* Course content */}
						<div className='mt-8'>
							<div className='mt-3 space-y-3'>
								{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
								<CourseContentAccordion course={courseForUI as any} />
							</div>
						</div>

						{/* Description */}
						<div className='mt-10'>
							<h2 className='text-sm font-semibold text-slate-900'>
								Description
							</h2>
							<div className='mt-3 space-y-3 text-sm leading-6 text-slate-700'>
								{courseForUI.description.length ? (
									courseForUI.description.map((p) => <p key={p}>{p}</p>)
								) : (
									<p className='text-slate-500'>No description yet.</p>
								)}
								<p className='text-xs text-slate-500'>
									<span className='font-semibold text-slate-700'>
										Prerequisites:
									</span>{' '}
									{courseForUI.prerequisites}
								</p>
							</div>
						</div>
					</section>

					{/* Right (sticky card) */}
					<aside className='lg:sticky lg:top-6 lg:self-start'>
						{/* <CoursePurchaseCard
							price={price}
							oldPrice={oldPrice}
							discountText={
								oldPrice
									? `${Math.round((1 - price / oldPrice) * 100)}% OFF`
									: undefined
							}
							offerEnds={oldPrice ? 'Limited-time offer' : undefined}
							preview={{
								type: 'image',
								src: product.image_url ?? '/placeholder.png',
							}}
						/> */}
						<CoursePurchaseCard
							product={product}
							oldPrice={oldPrice}
							discountText={
								oldPrice
									? `${Math.round((1 - price / oldPrice) * 100)}% OFF`
									: undefined
							}
							offerEnds={oldPrice ? 'Limited-time offer' : undefined}
							preview={{
								type: 'image',
								src: product.image_url ?? '/placeholder.png',
							}}
						/>
					</aside>
				</div>
			</div>
		</main>
	);
}
