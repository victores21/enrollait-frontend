'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
	FiArrowLeft,
	FiUploadCloud,
	FiX,
	FiCheck,
	FiSave,
	FiTag,
} from 'react-icons/fi';
import { api, qs } from '@/lib/api/api';
import CardShell from '@/app/components/CardShell';
import TextInputField from '@/app/components/TextInputField';
import clsx from '@/lib/clsx';
import TextAreaField from '@/app/components/TextAreaField';
import MoneyInputField from '@/app/components/MoneyInputField';
import MultiSelectField from '@/app/components/MultiSelectField';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/** Moodle courses */
type MoodleCourse = {
	id: number;
	fullname?: string;
	shortname?: string;
	name?: string;
	moodle_course_id?: number;
};

type MoodleCoursesResponse = {
	items: MoodleCourse[];
	page: number;
	page_size: number;
	total_pages?: number;
	total_items?: number;
};

type CourseOption = {
	value: number;
	label: string; // "Medicine (8)"
	raw: MoodleCourse;
};

/** Categories */
type Category = {
	id: number;
	name: string;
	slug?: string;
};

type CategoriesResponse = {
	items: Category[];
	page: number;
	page_size: number;
	total_pages?: number;
	total_items?: number;
};

type CategoryOption = {
	value: number;
	label: string;
	raw: Category;
};

function toNumber(value: string): number {
	const n = Number(String(value ?? '').trim());
	return Number.isFinite(n) ? n : NaN;
}

function extractApiErrorMessage(data: any): string | null {
	// Supports:
	// { detail: "..." }
	// { detail: { message: "..." } }
	// { message: "..." }
	if (!data) return null;

	if (typeof data.detail === 'string') return data.detail;

	if (data.detail && typeof data.detail === 'object') {
		if (typeof data.detail.message === 'string') return data.detail.message;
	}

	if (typeof data.message === 'string') return data.message;

	return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isAlreadyExists409(data: any): boolean {
	const msg = extractApiErrorMessage(data)?.toLowerCase() ?? '';
	// matches your example "already exists"
	return msg.includes('already exists');
}

export default function AdminNewProductPage() {
	// ✅ Fix hydration mismatch: render react-select only after mount
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	// -----------------------------
	// Form state
	// -----------------------------
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [identifier, setIdentifier] = useState('');
	const [price, setPrice] = useState(''); // required
	const [discountedPrice, setDiscountedPrice] = useState('');

	// fixed for now to match your curl
	const currency = 'usd';
	const stockStatus: 'available' | 'not_available' = 'available';

	// image
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	// saving
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<{
		title?: string;
		price?: string;
		discounted_price?: string;
	}>({});

	// -----------------------------
	// Courses
	// -----------------------------
	const [coursesLoading, setCoursesLoading] = useState(false);
	const [coursesError, setCoursesError] = useState<string | null>(null);
	const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
	const [selectedCourses, setSelectedCourses] = useState<CourseOption[]>([]);
	const selectedCourseIds = selectedCourses.map((c) => c.value);

	// -----------------------------
	// Categories
	// -----------------------------
	const [catsLoading, setCatsLoading] = useState(false);
	const [catsError, setCatsError] = useState<string | null>(null);
	const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
	const [selectedCategories, setSelectedCategories] = useState<
		CategoryOption[]
	>([]);
	const selectedCategoryIds = selectedCategories.map((c) => c.value);
	const router = useRouter();

	// -----------------------------
	// Load moodle courses
	// -----------------------------
	useEffect(() => {
		let cancelled = false;

		async function loadCourses() {
			setCoursesLoading(true);
			setCoursesError(null);

			try {
				const res = await api<MoodleCoursesResponse>(
					`/courses` + qs({ order: 'updated_desc' }),
					{ cache: 'no-store' },
				);

				if (cancelled) return;

				const opts: CourseOption[] = (res.items ?? []).map((c) => {
					const name = c.fullname ?? c.name ?? c.shortname ?? `Course ${c.id}`;
					return {
						value: c.id,
						label: `${name} (${c.moodle_course_id})`,
						raw: c,
					};
				});

				setCourseOptions(opts);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (e: any) {
				if (cancelled) return;
				setCoursesError(e?.message ?? 'Failed to load Moodle courses');
				setCourseOptions([]);
			} finally {
				if (!cancelled) setCoursesLoading(false);
			}
		}

		loadCourses();
		return () => {
			cancelled = true;
		};
	}, []);

	// -----------------------------
	// Load categories
	// -----------------------------
	useEffect(() => {
		let cancelled = false;

		async function loadCategories() {
			setCatsLoading(true);
			setCatsError(null);

			try {
				const res = await api<CategoriesResponse>(
					`/categories` + qs({ include_counts: false }),
					{ cache: 'no-store' },
				);

				if (cancelled) return;

				const opts: CategoryOption[] = (res.items ?? []).map((c) => ({
					value: c.id,
					label: `${c?.name} (${c?.id})`,
					raw: c,
				}));

				setCategoryOptions(opts);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (e: any) {
				if (cancelled) return;
				setCatsError(e?.message ?? 'Failed to load categories');
				setCategoryOptions([]);
			} finally {
				if (!cancelled) setCatsLoading(false);
			}
		}

		loadCategories();
		return () => {
			cancelled = true;
		};
	}, []);

	// -----------------------------
	// Image preview
	// -----------------------------
	useEffect(() => {
		if (!imageFile) {
			setImagePreview(null);
			return;
		}
		const url = URL.createObjectURL(imageFile);
		setImagePreview(url);
		return () => URL.revokeObjectURL(url);
	}, [imageFile]);

	function onPickImage(file?: File | null) {
		if (!file) return;
		if (!file.type.startsWith('image/')) return;
		setImageFile(file);
	}

	function onDrop(e: React.DragEvent) {
		e.preventDefault();
		const f = e.dataTransfer.files?.[0];
		if (f) onPickImage(f);
	}

	// -----------------------------
	// Validation
	// -----------------------------
	function validate(): boolean {
		const next: typeof fieldErrors = {};
		setFormError(null);

		const t = title.trim();
		const p = toNumber(price);
		const dp = discountedPrice.trim() === '' ? 0 : toNumber(discountedPrice);

		if (!t) next.title = 'Title is required.';
		if (!Number.isFinite(p) || p <= 0)
			next.price = 'Price must be a number greater than 0.';

		if (discountedPrice.trim() !== '') {
			if (!Number.isFinite(dp) || dp < 0) {
				next.discounted_price = 'Discounted price must be a valid number.';
			} else if (dp > 0 && Number.isFinite(p) && dp >= p) {
				next.discounted_price = 'Discounted price must be lower than price.';
			}
		}

		setFieldErrors(next);
		return Object.keys(next).length === 0;
	}

	// -----------------------------
	// Submit
	// -----------------------------
	async function onSave() {
		if (!validate()) return;

		setSaving(true);
		setFormError(null);

		try {
			const fd = new FormData();
			fd.append('title', title.trim());
			fd.append('price', String(toNumber(price)));
			fd.append('currency', currency);

			if (identifier.trim()) fd.append('identifier', identifier.trim());
			if (description.trim()) fd.append('description', description.trim());

			const dpRaw = discountedPrice.trim();
			if (dpRaw !== '') {
				const dp = toNumber(dpRaw);
				fd.append('discounted_price', dp > 0 ? String(dp) : '');
			} else {
				fd.append('discounted_price', '');
			}

			fd.append('stock_status', stockStatus);

			if (selectedCourseIds.length === 0) {
				fd.append('course_ids', '');
			} else {
				fd.append('course_ids', `[${selectedCourseIds.join(',')}]`);
			}

			if (selectedCategoryIds.length === 0) {
				fd.append('category_ids', '');
			} else {
				fd.append('category_ids', `[${selectedCategoryIds.join(',')}]`);
			}

			if (imageFile) {
				fd.append('image', imageFile, imageFile.name);
			}

			// fd.append('published', String(published)); // if backend supports

			const baseUrl =
				process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
			const res = await fetch(`${baseUrl}/products`, {
				method: 'POST',
				headers: { accept: 'application/json' },
				body: fd,
			});

			if (!res.ok) {
				let data: any = null;
				try {
					data = await res.json();
				} catch {
					// non-json response
				}

				const msg =
					extractApiErrorMessage(data) ??
					`Failed to create product (HTTP ${res.status}).`;

				// clear stale field errors before setting new ones
				setFieldErrors({});

				// Specific: already exists
				if (res.status === 409 && isAlreadyExists409(data)) {
					setFormError(msg);
					setFieldErrors((prev) => ({ ...prev, title: msg }));
					toast.error(msg);
					throw new Error(msg);
				}

				setFormError(msg);
				throw new Error(msg);
			}

			const created = await res.json();
			console.log('CREATED PRODUCT', created);
			toast.success('Product created successfully!');
			router.push(`/admin/products/${created?.product?.id}`);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			// If we already set formError above, keep it.
			if (!formError) {
				setFormError(e?.message ?? 'Failed to create product.');
			}
		} finally {
			setSaving(false);
		}
	}

	const priceHint = useMemo(() => {
		if (!price || !discountedPrice) return null;
		const r = toNumber(price);
		const d = toNumber(discountedPrice);
		if (!Number.isFinite(r) || !Number.isFinite(d)) return null;
		if (d <= 0) return null;
		if (d >= r) return 'Discounted price must be lower than price.';
		const pct = Math.round(((r - d) / r) * 100);
		return `Discount: ${pct}% off`;
	}, [price, discountedPrice]);

	return (
		<main className='mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8'>
			{/* Top header */}
			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
				<div className='flex items-start gap-3'>
					<Link
						href='/admin/products'
						className='mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
						aria-label='Back'
					>
						<FiArrowLeft />
					</Link>

					<div>
						<h1 className='text-2xl font-extrabold tracking-tight'>
							New Product
						</h1>
					</div>
				</div>

				<div className='flex items-center gap-2'>
					{/* <button
						type='button'
						className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50'
					>
						<FiEye />
						Preview
					</button> */}

					<button
						type='button'
						onClick={onSave}
						disabled={saving}
						className={clsx(
							'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm',
							saving ? 'bg-blue-400' : 'bg-primary hover:bg-blue-700',
						)}
					>
						<FiSave />
						{saving ? 'Saving...' : 'Save'}
					</button>
				</div>
			</div>

			{/* Content grid */}
			<div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12'>
				{/* Left */}
				<div className='lg:col-span-8 space-y-6'>
					<CardShell
						title='Product Information'
						subtitle='Core details shown on your marketplace product page.'
					>
						<div className='space-y-6'>
							<TextInputField
								label='Product Title'
								required
								hint='A clear name increases conversion.'
								value={title}
								onChange={(v) => {
									setTitle(v);
									if (fieldErrors.title)
										setFieldErrors((p) => ({ ...p, title: undefined }));
									if (formError) setFormError(null);
								}}
								placeholder='Product title...'
								error={fieldErrors.title}
							/>

							<TextAreaField
								label='Product Description'
								value={description}
								onChange={(v) => {
									setDescription(v);
									if (formError) setFormError(null);
								}}
								placeholder='Description...'
							/>

							<TextInputField
								label='Identifier'
								hint='(SKU/slug)...'
								value={identifier}
								onChange={(v) => {
									setIdentifier(v);
									if (formError) setFormError(null);
								}}
								placeholder='Product identifier'
							/>
						</div>
					</CardShell>

					<CardShell title='Pricing'>
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							<MoneyInputField
								label='Price'
								required
								value={price}
								onChange={(v) => {
									setPrice(v);
									if (fieldErrors.price)
										setFieldErrors((p) => ({ ...p, price: undefined }));
									if (formError) setFormError(null);
								}}
								placeholder='10'
								error={fieldErrors.price}
								trailing={
									<span className='text-[11px] font-extrabold text-slate-500'>
										{currency.toUpperCase()}
									</span>
								}
							/>

							<MoneyInputField
								label='Discounted Price'
								value={discountedPrice}
								onChange={(v) => {
									setDiscountedPrice(v);
									if (fieldErrors.discounted_price)
										setFieldErrors((p) => ({
											...p,
											discounted_price: undefined,
										}));
									if (formError) setFormError(null);
								}}
								placeholder='0.00'
								error={fieldErrors.discounted_price}
							/>
						</div>

						{priceHint && priceHint.includes('lower') ? (
							<div className='inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold mt-4 text-yellow-700'>
								<FiCheck />
								{priceHint}
							</div>
						) : null}
					</CardShell>

					<CardShell
						title='Categories'
						subtitle='Assign one or more categories.'
						right={
							<span className='inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200'>
								<FiTag />
								{selectedCategoryIds.length}
							</span>
						}
					>
						<MultiSelectField<CategoryOption>
							mounted={mounted}
							label='Categories'
							instanceId='product-categories-select'
							inputId='product-categories-select-input'
							isLoading={catsLoading}
							options={categoryOptions}
							value={selectedCategories}
							onChange={(vals) => {
								setSelectedCategories(vals);
								if (formError) setFormError(null);
							}}
							placeholder='Search categories...'
							noOptionsMessage={() =>
								catsLoading ? 'Loading...' : 'No categories found'
							}
							error={catsError}
						/>
					</CardShell>

					<CardShell
						title='Associate Courses'
						subtitle='Link Moodle courses for auto-enrollment.'
					>
						<MultiSelectField<CourseOption>
							mounted={mounted}
							label='Courses'
							instanceId='moodle-courses-select'
							inputId='moodle-courses-select-input'
							isLoading={coursesLoading}
							options={courseOptions}
							value={selectedCourses}
							onChange={(vals) => {
								setSelectedCourses(vals);
								if (formError) setFormError(null);
							}}
							placeholder='Search Moodle course ID or name...'
							noOptionsMessage={() =>
								coursesLoading ? 'Loading...' : 'No courses found'
							}
							error={coursesError}
						/>

						{mounted ? (
							<div className='mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-extrabold text-slate-700'>
								Linked courses:{' '}
								<span className='text-slate-900'>
									{selectedCourseIds.length}
								</span>
							</div>
						) : null}
					</CardShell>
				</div>

				{/* Right */}
				<div className='lg:col-span-4 space-y-6'>
					<CardShell
						title='Product Image'
						subtitle='Optional: upload a thumbnail. Sent as multipart file field "image".'
					>
						<div
							onDragOver={(e) => e.preventDefault()}
							onDrop={onDrop}
							className='rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4'
						>
							<input
								type='file'
								accept='image/*'
								className='hidden'
								id='product-image'
								onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
							/>

							{imagePreview ? (
								<div className='relative h-[220px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white'>
									<Image
										src={imagePreview}
										alt='Product preview'
										fill
										className='object-cover'
										unoptimized
									/>
									<div className='absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-white/85 px-3 py-2 backdrop-blur'>
										<div className='truncate text-xs font-extrabold text-slate-700'>
											{imageFile?.name}
										</div>
										<button
											type='button'
											onClick={() => setImageFile(null)}
											className='inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
											aria-label='Remove image'
										>
											<FiX />
										</button>
									</div>
								</div>
							) : (
								<label
									htmlFor='product-image'
									className='flex cursor-pointer flex-col items-center justify-center rounded-xl px-4 py-8 text-center'
								>
									<div className='grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200'>
										<FiUploadCloud className='text-slate-500' />
									</div>
									<div className='mt-3 text-sm font-extrabold text-blue-600'>
										Click to upload{' '}
										<span className='text-slate-500 font-semibold'>
											or drag and drop
										</span>
									</div>
									<div className='mt-1 text-[11px] font-semibold text-slate-400'>
										PNG, JPG or WEBP (MAX 2MB)
									</div>
								</label>
							)}
						</div>
					</CardShell>

					{/* <CardShell title='Visibility'>
						<Toggle
							checked={published}
							onChange={(v) => {
								setPublished(v);
								if (formError) setFormError(null);
							}}
							label='Is published'
						/>
						<div className='mt-3 text-[11px] font-base text-slate-500'>
							Note: your provided{' '}
							<span className='font-extrabold'>POST /products</span> curl
							doesn&apos;t include a{' '}
							<span className='font-extrabold'>published</span> field. If your
							backend supports it, add it to FormData.
						</div>
					</CardShell> */}
				</div>
			</div>
		</main>
	);
}
