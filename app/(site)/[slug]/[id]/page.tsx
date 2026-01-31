export const dynamic = 'force-dynamic';

import CoursePurchaseCard from '@/app/components/CoursePurchaseCard';
import { api, qs } from '@/lib/api/api';
import { FiCheck } from 'react-icons/fi';
import type { Category, IntegrationsStatusResponse } from '@/app/types'; // adjust if needed
import { Breadcrumbs } from '@/app/components/Breadcrumb';

function HtmlBlock({ html }: { html?: string | null }) {
	const safe = (html ?? '').trim();
	if (!safe) return null;

	return (
		<div
			className='prose prose-slate prose-sm max-w-none'
			dangerouslySetInnerHTML={{ __html: safe }}
		/>
	);
}

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
	moodle_course_id?: number;
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

	// ✅ NEW (from your backend changes)
	learning_outcomes?: string[];
	long_description_html?: string | null; // ✅ NEW
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
		{ cache: 'no-store' },
	);

	const integrations = await api<IntegrationsStatusResponse>(
		'/integrations/status',
		{ cache: 'no-store' },
	);

	const product = data.product;

	const productForCard = {
		...product,
		moodle_course_id:
			product.moodle_course_id ?? product.courses?.[0]?.moodle_course_id ?? 0,
	};

	// ✅ Use DB-driven outcomes, fallback to your default bullets
	const learnFromDb =
		Array.isArray(product.learning_outcomes) &&
		product.learning_outcomes.map((s) => String(s).trim()).filter(Boolean);

	const learn = learnFromDb;

	// Prices for purchase card
	const price = Number(product.discounted_price ?? product.price);
	const oldPrice = product.discounted_price ? Number(product.price) : undefined;

	const crumbs = [{ label: 'Home', href: '/' }, { label: product.title }];

	return (
		<main className='px-4 xl:px-0'>
			<div className='mx-auto w-full pt-4'>
				{/* Breadcrumbs */}
				<Breadcrumbs items={crumbs} />

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
						{learn && learn?.length > 0 && (
							<>
								<div className='mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
									<h2 className='text-xl mb-8 font-semibold text-slate-900'>
										What you&apos;ll learn
									</h2>

									{/* If there are many items, keep the same 2-column look */}
									<div className='mt-4 grid gap-3 sm:grid-cols-2'>
										{learn.map((item, idx) => (
											<div key={`${item}-${idx}`} className='flex gap-3'>
												<div className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100'>
													<FiCheck className='h-4 w-4 text-blue-600' />
												</div>
												<p className='text-sm leading-6 text-slate-700'>
													{item}
												</p>
											</div>
										))}
									</div>

									{/* Optional empty-state if you want to strictly show nothing when empty */}
									{/* {!learn.length ? (
								<p className='mt-3 text-sm text-slate-500'>No learning outcomes yet.</p>
							) : null} */}
								</div>
							</>
						)}

						{product?.long_description_html &&
							product.long_description_html?.length > 7 && (
								<div className='mt-10'>
									<h2 className='text-xl font-semibold text-slate-900'>
										Description
									</h2>

									<div className='mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
										{/* ✅ Rich HTML description (preferred) */}
										<HtmlBlock html={product.long_description_html} />

										{/* ✅ Fallback to plain text if no HTML */}
										{!String(product.long_description_html ?? '').trim() ? (
											product.description?.trim() ? (
												<p className='text-sm leading-6 text-slate-700'>
													{product.description}
												</p>
											) : (
												<p className='text-sm text-slate-500'>
													No description yet.
												</p>
											)
										) : null}
									</div>
								</div>
							)}
					</section>

					<aside className='lg:sticky lg:top-6 lg:self-start'>
						<CoursePurchaseCard
							product={productForCard}
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
							isStripeConfigured={integrations?.stripe?.configured}
						/>
					</aside>
				</div>
			</div>
		</main>
	);
}
