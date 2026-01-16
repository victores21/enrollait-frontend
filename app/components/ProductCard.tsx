// 'use client';

// import Image from 'next/image';
// import { useRouter } from 'next/navigation';
// import type { ProductItem } from '../types';

// function Price({
// 	price,
// 	discounted_price,
// 	currency,
// }: {
// 	price: string;
// 	discounted_price: string | null;
// 	currency: string;
// }) {
// 	const c = currency?.toLowerCase?.() ?? '';
// 	const symbol = c === 'usd' ? '$' : c === 'cop' ? '$' : '';

// 	const p = Number(price);
// 	const dp = discounted_price !== null ? Number(discounted_price) : NaN;

// 	const hasDiscount =
// 		discounted_price !== null &&
// 		!Number.isNaN(dp) &&
// 		!Number.isNaN(p) &&
// 		dp < p;

// 	if (!hasDiscount) {
// 		return (
// 			<div className='text-lg font-extrabold text-gray-900'>
// 				{symbol}
// 				{Number.isNaN(p) ? price : p.toFixed(2)}
// 			</div>
// 		);
// 	}

// 	return (
// 		<div className='flex items-baseline gap-2'>
// 			<div className='text-lg font-extrabold text-gray-900'>
// 				{symbol}
// 				{dp.toFixed(2)}
// 			</div>
// 			<div className='text-sm font-semibold text-gray-400 line-through'>
// 				{symbol}
// 				{p.toFixed(2)}
// 			</div>
// 		</div>
// 	);
// }

// interface ProductCardProps {
// 	product: ProductItem;
// 	onClick?: (product: ProductItem) => void;
// }

// export default function ProductCard({ product, onClick }: ProductCardProps) {
// 	const router = useRouter();

// 	const imageSrc =
// 		product.imageUrl?.trim?.() ||
// 		'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=70';

// 	const categories = product.categories ?? [];

// 	const handleNavigate = () => {
// 		onClick?.(product);
// 		router.push(`/${product.slug}/${product.id}`);
// 	};

// 	return (
// 		<div
// 			role='link'
// 			tabIndex={0}
// 			onClick={handleNavigate}
// 			onKeyDown={(e) => {
// 				if (e.key === 'Enter' || e.key === ' ') handleNavigate();
// 			}}
// 			className={[
// 				'group overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 cursor-pointer',
// 				'transition-all duration-200 ease-out',
// 				'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 hover:ring-black/10',
// 				'focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
// 			].join(' ')}
// 		>
// 			<div className='relative h-36 w-full'>
// 				<Image
// 					src={imageSrc}
// 					alt={product.title}
// 					fill
// 					className='object-cover'
// 				/>

// 				{!product.is_published && (
// 					<span className='absolute right-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white'>
// 						Private
// 					</span>
// 				)}
// 			</div>

// 			<div className='p-4 h-[calc(100%-9rem)] flex flex-col justify-between'>
// 				<div>
// 					<div className='mt-1 line-clamp-2 text-base font-extrabold text-gray-900'>
// 						{product.title}
// 					</div>

// 					{product.description ? (
// 						<div className='mt-1 line-clamp-2 text-sm text-gray-500'>
// 							{product.description}
// 						</div>
// 					) : null}

// 					{categories.length ? (
// 						<div className='mt-3 flex flex-wrap gap-2'>
// 							{categories.slice(0, 3).map((c) => (
// 								<span
// 									key={c.id}
// 									className='rounded-full border-primary border px-2 py-1 text-xs text-primary font-bold'
// 								>
// 									{c.name}
// 								</span>
// 							))}
// 						</div>
// 					) : null}
// 				</div>

// 				<div className='mt-4 flex items-center justify-between'>
// 					<Price
// 						price={product.price}
// 						discounted_price={product.discounted_price}
// 						currency={product.currency}
// 					/>

// 					<button
// 						type='button'
// 						onClick={(e) => {
// 							e.stopPropagation(); // ✅ prevent card navigation
// 							// add to cart logic here
// 						}}
// 						className='rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white hover:opacity-95 cursor-pointer'
// 					>
// 						Add to cart
// 					</button>
// 				</div>
// 			</div>
// 		</div>
// 	);
// }

'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ProductItem } from '../types';

function Price({
	price,
	discounted_price,
	currency,
}: {
	price: string;
	discounted_price: string | null;
	currency: string;
}) {
	const c = currency?.toLowerCase?.() ?? '';
	const symbol = c === 'usd' ? '$' : c === 'cop' ? '$' : '';

	const p = Number(price);
	const dp = discounted_price !== null ? Number(discounted_price) : NaN;

	const hasDiscount =
		discounted_price !== null &&
		!Number.isNaN(dp) &&
		!Number.isNaN(p) &&
		dp < p;

	if (!hasDiscount) {
		return (
			<div className='text-lg font-extrabold text-gray-900'>
				{symbol}
				{Number.isNaN(p) ? price : p.toFixed(2)}
			</div>
		);
	}

	return (
		<div className='flex items-baseline gap-2'>
			<div className='text-lg font-extrabold text-gray-900'>
				{symbol}
				{dp.toFixed(2)}
			</div>
			<div className='text-sm font-semibold text-gray-400 line-through'>
				{symbol}
				{p.toFixed(2)}
			</div>
		</div>
	);
}

interface ProductCardProps {
	product: ProductItem;
	onClick?: (product: ProductItem) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
	const href = `/${product.slug}/${product.id}`;

	const imageSrc =
		product.image_url?.trim?.() ||
		'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=70';

	const categories = product.categories ?? [];

	return (
		<Link
			href={href}
			onClick={() => onClick?.(product)}
			className={[
				'group block overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 cursor-pointer',
				'transition-all duration-200 ease-out',
				'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 hover:ring-black/10',
				'focus:outline-none focus:ring-2 focus:ring-[var(--primary)]',
			].join(' ')}
		>
			<div className='relative h-36 w-full'>
				<Image
					src={imageSrc}
					alt={product.title}
					fill
					className='object-cover'
				/>

				{!product.is_published && (
					<span className='absolute right-3 top-3 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white'>
						Private
					</span>
				)}
			</div>

			<div className='p-4 h-[calc(100%-9rem)] flex flex-col justify-between'>
				<div>
					<div className='mt-1 line-clamp-2 text-base font-extrabold text-gray-900'>
						{product.title}
					</div>

					{product.description ? (
						<div className='mt-1 line-clamp-2 text-sm text-gray-500'>
							{product.description}
						</div>
					) : null}

					{categories.length ? (
						<div className='mt-3 flex flex-wrap gap-2'>
							{categories.slice(0, 3).map((c) => (
								<span
									key={c.id}
									className='rounded-full border-primary border px-2 py-1 text-xs text-primary font-bold'
								>
									{c.name}
								</span>
							))}
						</div>
					) : null}
				</div>

				<div className='mt-4 flex items-center justify-between'>
					<Price
						price={product.price}
						discounted_price={product.discounted_price}
						currency={product.currency}
					/>

					<button
						type='button'
						onClick={(e) => {
							e.preventDefault(); // ✅ prevent Link navigation
							e.stopPropagation();
							// add to cart logic here
						}}
						className='rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white hover:opacity-95 cursor-pointer'
					>
						Add to cart
					</button>
				</div>
			</div>
		</Link>
	);
}
