// 'use client';

// import React, { useEffect, useMemo, useState } from 'react';
// import Link from 'next/link';
// import Image from 'next/image';
// import { useParams, useRouter } from 'next/navigation';
// import { toast } from 'sonner';
// import {
// 	FiArrowLeft,
// 	FiUploadCloud,
// 	FiX,
// 	FiSave,
// 	FiTag,
// 	FiAlertTriangle,
// } from 'react-icons/fi';

// import { api, qs } from '@/lib/api/api';
// import clsx from '@/lib/clsx';
// import CardShell from '@/app/components/CardShell';
// import TextInputField from '@/app/components/TextInputField';
// import TextAreaField from '@/app/components/TextAreaField';
// import MoneyInputField from '@/app/components/MoneyInputField';
// import MultiSelectField from '@/app/components/MultiSelectField';
// import Toggle from '@/app/components/Toggle';
// import LoadingOverlay from '@/app/components/LoadingOverlay';

// /** Moodle courses */
// type MoodleCourse = {
// 	id: number; // IMPORTANT: must match product.courses.course_id
// 	fullname?: string;
// 	shortname?: string;
// 	name?: string;
// 	moodle_course_id?: number;
// };

// type MoodleCoursesResponse = {
// 	items: MoodleCourse[];
// 	page: number;
// 	page_size: number;
// 	total_pages?: number;
// 	total_items?: number;
// };

// type CourseOption = {
// 	value: number;
// 	label: string;
// 	raw: MoodleCourse;
// };

// /** Categories */
// type Category = {
// 	id: number;
// 	name: string;
// 	slug?: string;
// };

// type CategoriesResponse = {
// 	items: Category[];
// 	page: number;
// 	page_size: number;
// 	total_pages?: number;
// 	total_items?: number;
// };

// type CategoryOption = {
// 	value: number;
// 	label: string;
// 	raw: Category;
// };

// // ✅ Product response shape (based on your backend)
// type ProductCourse = {
// 	course_id: number;
// 	moodle_course_id?: number;
// 	fullname?: string;
// 	summary?: string;
// };

// type ProductCategory = {
// 	id: number;
// 	name: string;
// 	slug?: string;
// };

// type Product = {
// 	id: number;
// 	title?: string;
// 	description?: string;
// 	identifier?: string;
// 	image_url?: string | null;
// 	price?: string | number;
// 	discounted_price?: string | number | null;
// 	currency?: string;
// 	stock_status?: 'available' | 'not_available' | string;
// 	is_published?: boolean;
// 	courses?: ProductCourse[];
// 	categories?: ProductCategory[];
// };

// function toNumber(value: string): number {
// 	const n = Number(String(value ?? '').trim());
// 	return Number.isFinite(n) ? n : NaN;
// }

// function extractApiErrorMessage(data: any): string | null {
// 	if (!data) return null;

// 	if (typeof data.detail === 'string') return data.detail;

// 	// FastAPI errors can be list of {loc,msg,type}
// 	if (Array.isArray(data.detail) && data.detail[0]?.msg) {
// 		return data.detail[0].msg as string;
// 	}

// 	if (data.detail && typeof data.detail === 'object') {
// 		if (typeof data.detail.message === 'string') return data.detail.message;
// 	}

// 	if (typeof data.message === 'string') return data.message;

// 	return null;
// }

// function normalizeProductResponse(data: any): Product | null {
// 	if (!data) return null;
// 	if (data.product && typeof data.product === 'object')
// 		return data.product as Product;
// 	return null;
// }

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// function isAlreadyExists409(data: any): boolean {
// 	const msg = extractApiErrorMessage(data)?.toLowerCase() ?? '';
// 	return (
// 		msg.includes('already exists') ||
// 		msg.includes('already') ||
// 		msg.includes('exists')
// 	);
// }

// type FieldErrors = {
// 	title?: string;
// 	price?: string;
// 	discounted_price?: string;
// 	image?: string;
// 	course_ids?: string;
// 	category_ids?: string;
// 	is_published?: string;
// };

// /**
//  * Map FastAPI 422 detail list into field errors.
//  * FastAPI: { detail: [{ loc: ["body","title"], msg: "...", type: "..." }, ...] }
//  * With multipart Form, loc often: ["body","fieldname"] or ["form","fieldname"]
//  */
// function mapFastApi422ToFieldErrors(data: any): FieldErrors {
// 	const out: FieldErrors = {};
// 	const detail = data?.detail;

// 	if (!Array.isArray(detail)) return out;

// 	for (const err of detail) {
// 		const loc: unknown = err?.loc;
// 		const msg: string =
// 			typeof err?.msg === 'string' ? err.msg : 'Invalid value';

// 		// loc might be ["body","title"] or ["form","title"] or ["query","..."]
// 		const key =
// 			Array.isArray(loc) && typeof loc[loc.length - 1] === 'string'
// 				? (loc[loc.length - 1] as string)
// 				: null;

// 		if (!key) continue;

// 		if (key === 'title') out.title = msg;
// 		if (key === 'price') out.price = msg;
// 		if (key === 'discounted_price') out.discounted_price = msg;
// 		if (key === 'image') out.image = msg;
// 		if (key === 'course_ids') out.course_ids = msg;
// 		if (key === 'category_ids') out.category_ids = msg;
// 		if (key === 'is_published') out.is_published = msg;
// 	}

// 	return out;
// }

// function jsonArrayString(ids: number[]): string {
// 	// Always valid JSON array string (clears relations when empty)
// 	return JSON.stringify(ids ?? []);
// }

// export default function AdminEditProductPage() {
// 	const router = useRouter();
// 	const params = useParams();
// 	const idParam = params?.id;
// 	const productId = Number(Array.isArray(idParam) ? idParam[0] : idParam);

// 	const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

// 	// ✅ Fix hydration mismatch: render react-select only after mount
// 	const [mounted, setMounted] = useState(false);
// 	useEffect(() => setMounted(true), []);

// 	// -----------------------------
// 	// Product loading
// 	// -----------------------------
// 	const [loadingProduct, setLoadingProduct] = useState(true);
// 	const [productError, setProductError] = useState<string | null>(null);
// 	const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

// 	// -----------------------------
// 	// Form state
// 	// -----------------------------
// 	const [title, setTitle] = useState('');
// 	const [description, setDescription] = useState('');
// 	const [identifier, setIdentifier] = useState('');
// 	const [price, setPrice] = useState('');
// 	const [discountedPrice, setDiscountedPrice] = useState('');
// 	const [isPublished, setIsPublished] = useState(true);
// 	const [removeExistingImage, setRemoveExistingImage] = useState(false);

// 	// fixed for now
// 	const currency = 'usd';
// 	const stockStatus: 'available' | 'not_available' = 'available';

// 	// image
// 	const [imageFile, setImageFile] = useState<File | null>(null);
// 	const [imagePreview, setImagePreview] = useState<string | null>(null);

// 	// saving + errors
// 	const [saving, setSaving] = useState(false);
// 	const [formError, setFormError] = useState<string | null>(null);
// 	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

// 	// -----------------------------
// 	// Courses
// 	// -----------------------------
// 	const [coursesLoading, setCoursesLoading] = useState(false);
// 	const [coursesError, setCoursesError] = useState<string | null>(null);
// 	const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
// 	const [selectedCourses, setSelectedCourses] = useState<CourseOption[]>([]);
// 	const selectedCourseIds = selectedCourses.map((c) => c.value);
// 	const [initialCourseIds, setInitialCourseIds] = useState<number[]>([]);

// 	// -----------------------------
// 	// Categories
// 	// -----------------------------
// 	const [catsLoading, setCatsLoading] = useState(false);
// 	const [catsError, setCatsError] = useState<string | null>(null);
// 	const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
// 	const [selectedCategories, setSelectedCategories] = useState<
// 		CategoryOption[]
// 	>([]);
// 	const selectedCategoryIds = selectedCategories.map((c) => c.value);
// 	const [initialCategoryIds, setInitialCategoryIds] = useState<number[]>([]);

// 	// -----------------------------
// 	// Load product by id
// 	// -----------------------------
// 	useEffect(() => {
// 		let cancelled = false;

// 		async function loadProduct() {
// 			if (!Number.isFinite(productId) || productId <= 0) {
// 				setProductError('Invalid product id.');
// 				setLoadingProduct(false);
// 				return;
// 			}

// 			setLoadingProduct(true);
// 			setProductError(null);

// 			try {
// 				const res = await fetch(`${baseUrl}/products/${productId}`, {
// 					method: 'GET',
// 					headers: { accept: 'application/json' },
// 					cache: 'no-store',
// 				});

// 				if (!res.ok) {
// 					let msg = `Failed to load product (HTTP ${res.status}).`;
// 					try {
// 						const data = await res.json();
// 						msg = extractApiErrorMessage(data) ?? msg;
// 					} catch {}
// 					throw new Error(msg);
// 				}

// 				const data = await res.json();
// 				const p = normalizeProductResponse(data);
// 				if (!p) throw new Error('Invalid product response.');

// 				if (cancelled) return;

// 				setTitle(p.title ?? '');
// 				setDescription(p.description ?? '');
// 				setIdentifier(p.identifier ?? '');

// 				setPrice(p.price != null ? String(p.price) : '');
// 				setDiscountedPrice(
// 					p.discounted_price == null ? '' : String(p.discounted_price),
// 				);

// 				setExistingImageUrl(p.image_url ?? null);

// 				if (typeof p.is_published === 'boolean') setIsPublished(p.is_published);

// 				const cids = Array.isArray(p.courses)
// 					? p.courses.map((c) => c.course_id).filter((n) => Number.isFinite(n))
// 					: [];
// 				setInitialCourseIds(cids);

// 				const catIds = Array.isArray(p.categories)
// 					? p.categories.map((c) => c.id).filter((n) => Number.isFinite(n))
// 					: [];
// 				setInitialCategoryIds(catIds);
// 			} catch (e: any) {
// 				if (cancelled) return;
// 				setProductError(e?.message ?? 'Failed to load product.');
// 			} finally {
// 				if (!cancelled) setLoadingProduct(false);
// 			}
// 		}

// 		loadProduct();
// 		return () => {
// 			cancelled = true;
// 		};
// 	}, [baseUrl, productId]);

// 	// -----------------------------
// 	// Load courses
// 	// -----------------------------
// 	useEffect(() => {
// 		let cancelled = false;

// 		async function loadCourses() {
// 			setCoursesLoading(true);
// 			setCoursesError(null);

// 			try {
// 				const res = await api<MoodleCoursesResponse>(
// 					`/courses` + qs({ order: 'updated_desc' }),
// 					{ cache: 'no-store' },
// 				);

// 				if (cancelled) return;

// 				const opts: CourseOption[] = (res.items ?? []).map((c) => {
// 					const name = c.fullname ?? c.name ?? c.shortname ?? `Course ${c.id}`;
// 					return {
// 						value: c.id,
// 						label: `${name} (${c.moodle_course_id ?? c.id})`,
// 						raw: c,
// 					};
// 				});

// 				setCourseOptions(opts);
// 			} catch (e: any) {
// 				if (cancelled) return;
// 				setCoursesError(e?.message ?? 'Failed to load Moodle courses');
// 				setCourseOptions([]);
// 			} finally {
// 				if (!cancelled) setCoursesLoading(false);
// 			}
// 		}

// 		loadCourses();
// 		return () => {
// 			cancelled = true;
// 		};
// 	}, []);

// 	// -----------------------------
// 	// Load categories
// 	// -----------------------------
// 	useEffect(() => {
// 		let cancelled = false;

// 		async function loadCategories() {
// 			setCatsLoading(true);
// 			setCatsError(null);

// 			try {
// 				const res = await api<CategoriesResponse>(
// 					`/categories` + qs({ include_counts: false }),
// 					{ cache: 'no-store' },
// 				);

// 				if (cancelled) return;

// 				const opts: CategoryOption[] = (res.items ?? []).map((c) => ({
// 					value: c.id,
// 					label: `${c.name} (${c.id})`,
// 					raw: c,
// 				}));

// 				setCategoryOptions(opts);
// 			} catch (e: any) {
// 				if (cancelled) return;
// 				setCatsError(e?.message ?? 'Failed to load categories');
// 				setCategoryOptions([]);
// 			} finally {
// 				if (!cancelled) setCatsLoading(false);
// 			}
// 		}

// 		loadCategories();
// 		return () => {
// 			cancelled = true;
// 		};
// 	}, []);

// 	// -----------------------------
// 	// Autofill selected values
// 	// -----------------------------
// 	useEffect(() => {
// 		if (!courseOptions.length) return;
// 		if (!initialCourseIds.length) return;
// 		setSelectedCourses(
// 			courseOptions.filter((o) => initialCourseIds.includes(o.value)),
// 		);
// 		// eslint-disable-next-line react-hooks/exhaustive-deps
// 	}, [courseOptions.length, initialCourseIds.join(',')]);

// 	useEffect(() => {
// 		if (!categoryOptions.length) return;
// 		if (!initialCategoryIds.length) return;
// 		setSelectedCategories(
// 			categoryOptions.filter((o) => initialCategoryIds.includes(o.value)),
// 		);
// 		// eslint-disable-next-line react-hooks/exhaustive-deps
// 	}, [categoryOptions.length, initialCategoryIds.join(',')]);

// 	// -----------------------------
// 	// Image preview
// 	// -----------------------------
// 	useEffect(() => {
// 		if (!imageFile) {
// 			setImagePreview(null);
// 			return;
// 		}
// 		const url = URL.createObjectURL(imageFile);
// 		setImagePreview(url);
// 		return () => URL.revokeObjectURL(url);
// 	}, [imageFile]);

// 	// -----------------------------
// 	// Image pick with validation
// 	// -----------------------------
// 	const MAX_IMAGE_MB = 5; // backend uses 5MB
// 	const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
// 	const ALLOWED_IMAGE_TYPES = new Set([
// 		'image/png',
// 		'image/jpeg',
// 		'image/webp',
// 	]);

// 	function onPickImage(file?: File | null) {
// 		if (!file) return;

// 		const nextErrors: FieldErrors = {};
// 		if (!file.type || !ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
// 			nextErrors.image = 'Image must be PNG, JPG, or WEBP.';
// 		}
// 		if (file.size > MAX_IMAGE_BYTES) {
// 			nextErrors.image = `Image too large (max ${MAX_IMAGE_MB}MB).`;
// 		}

// 		if (nextErrors.image) {
// 			setFieldErrors((p) => ({ ...p, ...nextErrors }));
// 			toast.error(nextErrors.image);
// 			return;
// 		}

// 		// clear previous error
// 		setRemoveExistingImage(false);
// 		setFieldErrors((p) => ({ ...p, image: undefined }));
// 		setImageFile(file);
// 	}

// 	// -----------------------------
// 	// Validation
// 	// -----------------------------
// 	function validate(): boolean {
// 		const next: FieldErrors = {};
// 		setFormError(null);

// 		const t = title.trim();
// 		const p = toNumber(price);

// 		if (!t) next.title = 'Title is required.';
// 		if (!Number.isFinite(p) || p <= 0)
// 			next.price = 'Price must be a number greater than 0.';

// 		const dpRaw = discountedPrice.trim();
// 		if (dpRaw !== '') {
// 			const dp = toNumber(dpRaw);
// 			if (!Number.isFinite(dp) || dp < 0) {
// 				next.discounted_price = 'Discounted price must be a valid number.';
// 			} else if (Number.isFinite(p) && dp > 0 && dp >= p) {
// 				next.discounted_price = 'Discounted price must be lower than price.';
// 			}
// 		}

// 		setFieldErrors((prev) => ({ ...prev, ...next }));
// 		return Object.keys(next).length === 0;
// 	}

// 	// -----------------------------
// 	// Submit (PATCH /products/:id)
// 	// -----------------------------
// 	async function onSave() {
// 		if (!validate()) {
// 			toast.error('Please fix the highlighted fields.');
// 			return;
// 		}

// 		setSaving(true);
// 		setFormError(null);

// 		try {
// 			const fd = new FormData();

// 			// core fields
// 			fd.append('title', title.trim());
// 			fd.append('price', String(toNumber(price)));
// 			fd.append('currency', currency);

// 			// optional
// 			if (identifier.trim()) fd.append('identifier', identifier.trim());
// 			else fd.append('identifier', ''); // allows clearing

// 			if (description.trim()) fd.append('description', description.trim());
// 			else fd.append('description', ''); // allows clearing

// 			// discounted_price: send "" to clear, or number string
// 			const dpRaw = discountedPrice.trim();
// 			if (dpRaw === '') {
// 				fd.append('discounted_price', '');
// 			} else {
// 				const dp = toNumber(dpRaw);
// 				fd.append(
// 					'discounted_price',
// 					Number.isFinite(dp) && dp > 0 ? String(dp) : '',
// 				);
// 			}

// 			fd.append('stock_status', stockStatus);

// 			// ✅ IMPORTANT: Always send JSON array strings so backend can REPLACE (and clear)
// 			fd.append('course_ids', jsonArrayString(selectedCourseIds));
// 			fd.append('category_ids', jsonArrayString(selectedCategoryIds));

// 			// ✅ boolean as string
// 			fd.append('is_published', isPublished ? 'true' : 'false');

// 			if (imageFile) {
// 				fd.append('image', imageFile, imageFile.name);
// 			}

// 			if (removeExistingImage) {
// 				fd.append('image_url', ''); // tells backend to clear image_url
// 			}

// 			const res = await fetch(`${baseUrl}/products/${productId}`, {
// 				method: 'PATCH',
// 				headers: { accept: 'application/json' },
// 				body: fd,
// 			});

// 			let data: any = null;
// 			try {
// 				data = await res.json();
// 			} catch {}

// 			if (!res.ok) {
// 				// reset previous field errors but keep image error if any
// 				setFieldErrors((prev) => ({ image: prev.image }));

// 				// 422 FastAPI validation list
// 				if (res.status === 422 && data) {
// 					const mapped = mapFastApi422ToFieldErrors(data);
// 					const msg = extractApiErrorMessage(data) ?? 'Validation error.';
// 					setFieldErrors((prev) => ({ ...prev, ...mapped }));
// 					setFormError(msg);
// 					toast.error(msg);
// 					throw new Error(msg);
// 				}

// 				const msg =
// 					extractApiErrorMessage(data) ??
// 					`Failed to update product (HTTP ${res.status}).`;

// 				if (res.status === 409 && isAlreadyExists409(data)) {
// 					setFormError(msg);
// 					setFieldErrors((prev) => ({ ...prev, title: msg }));
// 					toast.error(msg);
// 					throw new Error(msg);
// 				}

// 				setFormError(msg);
// 				toast.error(msg);
// 				throw new Error(msg);
// 			}

// 			// Update UI with returned product
// 			const p = normalizeProductResponse(data);
// 			if (p) {
// 				setExistingImageUrl(p.image_url ?? existingImageUrl);
// 				if (typeof p.is_published === 'boolean') setIsPublished(p.is_published);
// 				// if backend returns price/discounted_price normalized:
// 				if (p.price != null) setPrice(String(p.price));
// 				setDiscountedPrice(
// 					p.discounted_price == null ? '' : String(p.discounted_price),
// 				);
// 			}

// 			toast.success('Product updated successfully!');
// 			// optionally clear local selected image once uploaded
// 			setImageFile(null);

// 			if (p) {
// 				setExistingImageUrl(p.image_url ?? null);
// 				setRemoveExistingImage(false);
// 			}
// 			router.refresh();
// 		} catch (e: any) {
// 			setFormError(e?.message ?? 'Failed to update product.');
// 		} finally {
// 			setSaving(false);
// 		}
// 	}

// 	const priceHint = useMemo(() => {
// 		if (!price || !discountedPrice) return null;
// 		const r = toNumber(price);
// 		const d = toNumber(discountedPrice);
// 		if (!Number.isFinite(r) || !Number.isFinite(d)) return null;
// 		if (d <= 0) return null;
// 		if (d >= r) return 'Discounted price must be lower than price.';
// 		const pct = Math.round(((r - d) / r) * 100);
// 		return `Discount: ${pct}% off`;
// 	}, [price, discountedPrice]);

// 	// const previewSrc = imagePreview || existingImageUrl;
// 	const previewSrc = imagePreview ?? existingImageUrl;

// 	return (
// 		<main className='mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8'>
// 			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
// 				<div className='flex items-start gap-3'>
// 					<Link
// 						href='/admin/products'
// 						className='mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
// 						aria-label='Back'
// 					>
// 						<FiArrowLeft />
// 					</Link>

// 					<div>
// 						<h1 className='text-2xl font-extrabold tracking-tight'>
// 							Edit Product
// 						</h1>
// 						<div className='mt-1 text-xs font-semibold text-slate-500'>
// 							ID: {Number.isFinite(productId) ? productId : '—'}
// 						</div>
// 					</div>
// 				</div>

// 				<button
// 					type='button'
// 					onClick={onSave}
// 					disabled={saving || loadingProduct}
// 					className={clsx(
// 						'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm',
// 						saving || loadingProduct
// 							? 'bg-blue-400'
// 							: 'bg-primary hover:bg-blue-700',
// 					)}
// 				>
// 					<FiSave />
// 					{saving ? 'Saving...' : 'Save changes'}
// 				</button>
// 			</div>

// 			{productError ? (
// 				<div className='mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700'>
// 					<div className='flex items-start gap-2'>
// 						<FiAlertTriangle className='mt-0.5' />
// 						<div>{productError}</div>
// 					</div>
// 				</div>
// 			) : null}

// 			{formError ? (
// 				<div className='mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700'>
// 					<div className='flex items-start gap-2'>
// 						<FiAlertTriangle className='mt-0.5' />
// 						<div>{formError}</div>
// 					</div>
// 				</div>
// 			) : null}

// 			<div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12'>
// 				<div className='lg:col-span-8 space-y-6'>
// 					<CardShell
// 						title='Product Information'
// 						subtitle='Core details shown on your marketplace product page.'
// 					>
// 						<div className='space-y-6'>
// 							<TextInputField
// 								label='Product Title'
// 								required
// 								hint='A clear name increases conversion.'
// 								value={title}
// 								onChange={(v) => {
// 									setTitle(v);
// 									if (fieldErrors.title)
// 										setFieldErrors((p) => ({ ...p, title: undefined }));
// 									if (formError) setFormError(null);
// 								}}
// 								placeholder='Product title...'
// 								error={fieldErrors.title}
// 							/>

// 							<TextAreaField
// 								label='Product Description'
// 								value={description}
// 								onChange={(v) => {
// 									setDescription(v);
// 									if (formError) setFormError(null);
// 								}}
// 								placeholder='Description...'
// 							/>

// 							<TextInputField
// 								label='Identifier'
// 								hint='(SKU/slug)...'
// 								value={identifier}
// 								onChange={(v) => {
// 									setIdentifier(v);
// 									if (formError) setFormError(null);
// 								}}
// 								placeholder='Product identifier'
// 							/>
// 						</div>
// 					</CardShell>

// 					<CardShell title='Pricing'>
// 						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
// 							<MoneyInputField
// 								label='Price'
// 								required
// 								value={price}
// 								onChange={(v) => {
// 									setPrice(v);
// 									if (fieldErrors.price)
// 										setFieldErrors((p) => ({ ...p, price: undefined }));
// 									if (formError) setFormError(null);
// 								}}
// 								placeholder='10'
// 								error={fieldErrors.price}
// 								trailing={
// 									<span className='text-[11px] font-extrabold text-slate-500'>
// 										{currency.toUpperCase()}
// 									</span>
// 								}
// 							/>

// 							<MoneyInputField
// 								label='Discounted Price'
// 								value={discountedPrice}
// 								onChange={(v) => {
// 									setDiscountedPrice(v);
// 									if (fieldErrors.discounted_price) {
// 										setFieldErrors((p) => ({
// 											...p,
// 											discounted_price: undefined,
// 										}));
// 									}
// 									if (formError) setFormError(null);
// 								}}
// 								placeholder='0.00'
// 								error={fieldErrors.discounted_price}
// 							/>
// 						</div>

// 						{priceHint && priceHint.includes('lower') ? (
// 							<div className='mt-4 inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700'>
// 								<FiAlertTriangle />
// 								{priceHint}
// 							</div>
// 						) : null}
// 					</CardShell>

// 					<CardShell
// 						title='Categories'
// 						subtitle='Assign one or more categories.'
// 						right={
// 							<span className='inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200'>
// 								<FiTag />
// 								{selectedCategoryIds.length}
// 							</span>
// 						}
// 					>
// 						<MultiSelectField<CategoryOption>
// 							mounted={mounted}
// 							label='Categories'
// 							instanceId='product-categories-select'
// 							inputId='product-categories-select-input'
// 							isLoading={catsLoading || loadingProduct}
// 							options={categoryOptions}
// 							value={selectedCategories}
// 							onChange={(vals) => {
// 								setSelectedCategories(vals);
// 								if (formError) setFormError(null);
// 								if (fieldErrors.category_ids)
// 									setFieldErrors((p) => ({ ...p, category_ids: undefined }));
// 							}}
// 							placeholder='Search categories...'
// 							noOptionsMessage={() =>
// 								catsLoading ? 'Loading...' : 'No categories found'
// 							}
// 							error={catsError || fieldErrors.category_ids}
// 						/>
// 					</CardShell>

// 					<CardShell
// 						title='Associate Courses'
// 						subtitle='Link Moodle courses for auto-enrollment.'
// 					>
// 						<MultiSelectField<CourseOption>
// 							mounted={mounted}
// 							label='Courses'
// 							instanceId='moodle-courses-select'
// 							inputId='moodle-courses-select-input'
// 							isLoading={coursesLoading || loadingProduct}
// 							options={courseOptions}
// 							value={selectedCourses}
// 							onChange={(vals) => {
// 								setSelectedCourses(vals);
// 								if (formError) setFormError(null);
// 								if (fieldErrors.course_ids)
// 									setFieldErrors((p) => ({ ...p, course_ids: undefined }));
// 							}}
// 							placeholder='Search Moodle course ID or name...'
// 							noOptionsMessage={() =>
// 								coursesLoading ? 'Loading...' : 'No courses found'
// 							}
// 							error={coursesError || fieldErrors.course_ids}
// 						/>

// 						{mounted ? (
// 							<div className='mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-extrabold text-slate-700'>
// 								Linked courses:{' '}
// 								<span className='text-slate-900'>
// 									{selectedCourseIds.length}
// 								</span>
// 							</div>
// 						) : null}
// 					</CardShell>
// 				</div>

// 				<div className='lg:col-span-4 space-y-6'>
// 					<CardShell
// 						title='Product Image'
// 						subtitle={`Optional: upload a thumbnail. PNG/JPG/WEBP (max ${MAX_IMAGE_MB}MB). Sent as multipart "image".`}
// 					>
// 						<div
// 							onDragOver={(e) => e.preventDefault()}
// 							onDrop={(e) => {
// 								e.preventDefault();
// 								const f = e.dataTransfer.files?.[0];
// 								if (f) onPickImage(f);
// 							}}
// 							className={clsx(
// 								'rounded-2xl border border-dashed bg-slate-50 p-4',
// 								fieldErrors.image ? 'border-rose-300' : 'border-slate-300',
// 							)}
// 						>
// 							<input
// 								type='file'
// 								accept='image/png,image/jpeg,image/webp'
// 								className='hidden'
// 								id='product-image'
// 								onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
// 							/>

// 							{previewSrc ? (
// 								<div className='relative h-[220px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white'>
// 									<Image
// 										src={previewSrc}
// 										alt='Product preview'
// 										fill
// 										className='object-cover'
// 										unoptimized
// 									/>

// 									{removeExistingImage ? (
// 										<div className='mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-extrabold text-rose-700'>
// 											This product image will be removed when you save.
// 										</div>
// 									) : null}
// 									{/* <div className='absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-white/85 px-3 py-2 backdrop-blur'>
// 										<div className='truncate text-xs font-extrabold text-slate-700'>
// 											{imageFile?.name ?? 'Current image'}
// 										</div>
// 										<button
// 											type='button'
// 											onClick={() => setImageFile(null)}
// 											className='inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
// 											aria-label='Remove selected image'
// 										>
// 											<FiX />
// 										</button>
// 									</div> */}
// 									<div className='absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-white/85 px-3 py-2 backdrop-blur'>
// 										<div className='truncate text-xs font-extrabold text-slate-700'>
// 											{imageFile?.name
// 												? `Selected: ${imageFile.name}`
// 												: removeExistingImage
// 													? 'Current image will be removed'
// 													: 'Current image'}
// 										</div>

// 										<div className='flex items-center gap-2'>
// 											{/* Remove selected file */}
// 											{imageFile ? (
// 												<button
// 													type='button'
// 													onClick={() => {
// 														setImageFile(null);
// 														setFieldErrors((p) => ({ ...p, image: undefined }));
// 													}}
// 													className='inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50'
// 												>
// 													<FiX />
// 													Selected
// 												</button>
// 											) : null}

// 											{/* Remove stored image */}
// 											{existingImageUrl ? (
// 												<button
// 													type='button'
// 													onClick={() => {
// 														// toggle removal
// 														setRemoveExistingImage((v) => !v);
// 														setImageFile(null); // no file while removing
// 														setFieldErrors((p) => ({ ...p, image: undefined }));
// 													}}
// 													className={clsx(
// 														'inline-flex h-8 items-center gap-1 rounded-xl border px-2 text-xs font-extrabold',
// 														removeExistingImage
// 															? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
// 															: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
// 													)}
// 												>
// 													<FiX />
// 													Current
// 												</button>
// 											) : null}
// 										</div>
// 									</div>
// 								</div>
// 							) : (
// 								<label
// 									htmlFor='product-image'
// 									className='flex cursor-pointer flex-col items-center justify-center rounded-xl px-4 py-8 text-center'
// 								>
// 									<div className='grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200'>
// 										<FiUploadCloud className='text-slate-500' />
// 									</div>
// 									<div className='mt-3 text-sm font-extrabold text-blue-600'>
// 										Click to upload{' '}
// 										<span className='text-slate-500 font-semibold'>
// 											or drag and drop
// 										</span>
// 									</div>
// 									<div className='mt-1 text-[11px] font-semibold text-slate-400'>
// 										PNG, JPG or WEBP (MAX {MAX_IMAGE_MB}MB)
// 									</div>
// 								</label>
// 							)}

// 							{fieldErrors.image ? (
// 								<div className='mt-3 text-xs font-extrabold text-rose-700'>
// 									{fieldErrors.image}
// 								</div>
// 							) : null}
// 						</div>
// 					</CardShell>

// 					<CardShell title='Visibility'>
// 						<Toggle
// 							checked={isPublished}
// 							onChange={(v) => {
// 								setIsPublished(v);
// 								if (formError) setFormError(null);
// 								if (fieldErrors.is_published)
// 									setFieldErrors((p) => ({ ...p, is_published: undefined }));
// 							}}
// 							label='Is published'
// 						/>
// 						<div className='mt-3 text-[11px] font-base text-slate-500'>
// 							Sends <span className='font-extrabold'>is_published</span> in the
// 							update request.
// 						</div>
// 						{fieldErrors.is_published ? (
// 							<div className='mt-2 text-xs font-extrabold text-rose-700'>
// 								{fieldErrors.is_published}
// 							</div>
// 						) : null}
// 					</CardShell>
// 				</div>
// 			</div>
// 			<LoadingOverlay
// 				show={saving || loadingProduct}
// 				title={saving ? 'Saving product…' : 'Loading product…'}
// 				message={
// 					saving
// 						? 'Uploading changes and validating data.'
// 						: 'Fetching latest product details.'
// 				}
// 			/>
// 		</main>
// 	);
// }
// app/admin/products/[id]/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
	FiArrowLeft,
	FiUploadCloud,
	FiX,
	FiSave,
	FiTag,
	FiAlertTriangle,
	FiRefreshCw,
} from 'react-icons/fi';

import { api, qs } from '@/lib/api/api';
import clsx from '@/lib/clsx';
import CardShell from '@/app/components/CardShell';
import TextInputField from '@/app/components/TextInputField';
import TextAreaField from '@/app/components/TextAreaField';
import MoneyInputField from '@/app/components/MoneyInputField';
import MultiSelectField from '@/app/components/MultiSelectField';
import Toggle from '@/app/components/Toggle';
import LoadingOverlay from '@/app/components/LoadingOverlay';

/** Moodle courses */
type MoodleCourse = {
	id: number; // IMPORTANT: must match product.courses.course_id
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
	label: string;
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

// Product response shape (based on your backend GET /products/{product_id})
type ProductCourse = {
	course_id: number;
	moodle_course_id?: number;
	fullname?: string;
	summary?: string;
};

type ProductCategory = {
	id: number;
	name: string;
	slug?: string;
};

type Product = {
	id: number;
	title?: string;
	description?: string;
	identifier?: string;
	image_url?: string | null;
	price?: string | number;
	discounted_price?: string | number | null;
	currency?: string;
	stock_status?: 'available' | 'not_available' | string;
	is_published?: boolean;
	courses?: ProductCourse[];
	categories?: ProductCategory[];
};

type FieldErrors = {
	title?: string;
	price?: string;
	discounted_price?: string;
	image?: string;
	course_ids?: string;
	category_ids?: string;
	is_published?: string;
	image_url?: string;
};

function toNumber(value: string): number {
	const n = Number(String(value ?? '').trim());
	return Number.isFinite(n) ? n : NaN;
}

function extractApiErrorMessage(data: any): string | null {
	if (!data) return null;
	if (typeof data.detail === 'string') return data.detail;

	// FastAPI errors can be list of {loc,msg,type}
	if (Array.isArray(data.detail) && data.detail[0]?.msg) {
		return data.detail[0].msg as string;
	}

	if (data.detail && typeof data.detail === 'object') {
		if (typeof data.detail.message === 'string') return data.detail.message;
	}

	if (typeof data.message === 'string') return data.message;
	return null;
}

function normalizeProductResponse(data: any): Product | null {
	if (!data) return null;
	if (data.product && typeof data.product === 'object')
		return data.product as Product;
	return null;
}

function isAlreadyExists409(data: any): boolean {
	const msg = extractApiErrorMessage(data)?.toLowerCase() ?? '';
	return (
		msg.includes('already exists') ||
		msg.includes('already') ||
		msg.includes('exists')
	);
}

/**
 * Map FastAPI 422 detail list into field errors.
 * FastAPI: { detail: [{ loc: ["body","title"], msg: "...", type: "..." }, ...] }
 * With multipart Form, loc often: ["body","fieldname"] or ["form","fieldname"]
 */
function mapFastApi422ToFieldErrors(data: any): FieldErrors {
	const out: FieldErrors = {};
	const detail = data?.detail;
	if (!Array.isArray(detail)) return out;

	for (const err of detail) {
		const loc: unknown = err?.loc;
		const msg: string =
			typeof err?.msg === 'string' ? err.msg : 'Invalid value';

		const key =
			Array.isArray(loc) && typeof loc[loc.length - 1] === 'string'
				? (loc[loc.length - 1] as string)
				: null;

		if (!key) continue;

		if (key === 'title') out.title = msg;
		if (key === 'price') out.price = msg;
		if (key === 'discounted_price') out.discounted_price = msg;
		if (key === 'image') out.image = msg;
		if (key === 'course_ids') out.course_ids = msg;
		if (key === 'category_ids') out.category_ids = msg;
		if (key === 'is_published') out.is_published = msg;
		if (key === 'image_url') out.image_url = msg;
	}

	return out;
}

function jsonArrayString(ids: number[]): string {
	return JSON.stringify(ids ?? []);
}

function ButtonSpinner() {
	return (
		<span className='inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white' />
	);
}

export default function AdminEditProductPage() {
	const router = useRouter();
	const params = useParams();
	const idParam = params?.id;
	const productId = Number(Array.isArray(idParam) ? idParam[0] : idParam);

	const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

	// Fix hydration mismatch: render react-select only after mount
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	// Product loading
	const [loadingProduct, setLoadingProduct] = useState(true);
	const [productError, setProductError] = useState<string | null>(null);
	const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

	// Form state
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [identifier, setIdentifier] = useState('');
	const [price, setPrice] = useState('');
	const [discountedPrice, setDiscountedPrice] = useState('');
	const [isPublished, setIsPublished] = useState(true);

	// fixed for now
	const currency = 'usd';
	const stockStatus: 'available' | 'not_available' = 'available';

	// image
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	// allow deleting stored image
	const [removeExistingImage, setRemoveExistingImage] = useState(false);

	// saving + errors
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

	// Courses
	const [coursesLoading, setCoursesLoading] = useState(false);
	const [coursesError, setCoursesError] = useState<string | null>(null);
	const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
	const [selectedCourses, setSelectedCourses] = useState<CourseOption[]>([]);
	const selectedCourseIds = selectedCourses.map((c) => c.value);
	const [initialCourseIds, setInitialCourseIds] = useState<number[]>([]);

	// Categories
	const [catsLoading, setCatsLoading] = useState(false);
	const [catsError, setCatsError] = useState<string | null>(null);
	const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
	const [selectedCategories, setSelectedCategories] = useState<
		CategoryOption[]
	>([]);
	const selectedCategoryIds = selectedCategories.map((c) => c.value);
	const [initialCategoryIds, setInitialCategoryIds] = useState<number[]>([]);

	// Load product
	useEffect(() => {
		let cancelled = false;

		async function loadProduct() {
			if (!Number.isFinite(productId) || productId <= 0) {
				setProductError('Invalid product id.');
				setLoadingProduct(false);
				return;
			}

			setLoadingProduct(true);
			setProductError(null);

			try {
				const res = await fetch(`${baseUrl}/products/${productId}`, {
					method: 'GET',
					headers: { accept: 'application/json' },
					cache: 'no-store',
				});

				if (!res.ok) {
					let msg = `Failed to load product (HTTP ${res.status}).`;
					try {
						const data = await res.json();
						msg = extractApiErrorMessage(data) ?? msg;
					} catch {}
					throw new Error(msg);
				}

				const data = await res.json();
				const p = normalizeProductResponse(data);
				if (!p) throw new Error('Invalid product response.');

				if (cancelled) return;

				setTitle(p.title ?? '');
				setDescription(p.description ?? '');
				setIdentifier(p.identifier ?? '');

				setPrice(p.price != null ? String(p.price) : '');
				setDiscountedPrice(
					p.discounted_price == null ? '' : String(p.discounted_price),
				);

				setExistingImageUrl(p.image_url ?? null);

				// reset image actions
				setRemoveExistingImage(false);
				setImageFile(null);

				if (typeof p.is_published === 'boolean') setIsPublished(p.is_published);

				// extract initial ids for multiselect
				const cids = Array.isArray(p.courses)
					? p.courses.map((c) => c.course_id).filter((n) => Number.isFinite(n))
					: [];
				setInitialCourseIds(cids);

				const catIds = Array.isArray(p.categories)
					? p.categories.map((c) => c.id).filter((n) => Number.isFinite(n))
					: [];
				setInitialCategoryIds(catIds);
			} catch (e: any) {
				if (cancelled) return;
				setProductError(e?.message ?? 'Failed to load product.');
			} finally {
				if (!cancelled) setLoadingProduct(false);
			}
		}

		loadProduct();
		return () => {
			cancelled = true;
		};
	}, [baseUrl, productId]);

	// Load courses
	useEffect(() => {
		let cancelled = false;

		async function loadCourses() {
			setCoursesLoading(true);
			setCoursesError(null);

			try {
				const res = await api<MoodleCoursesResponse>(
					`/courses` + qs({ order: 'updated_desc' }),
					{
						cache: 'no-store',
					},
				);

				if (cancelled) return;

				const opts: CourseOption[] = (res.items ?? []).map((c) => {
					const name = c.fullname ?? c.name ?? c.shortname ?? `Course ${c.id}`;
					return {
						value: c.id,
						label: `${name} (${c.moodle_course_id ?? c.id})`,
						raw: c,
					};
				});

				setCourseOptions(opts);
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

	// Load categories
	useEffect(() => {
		let cancelled = false;

		async function loadCategories() {
			setCatsLoading(true);
			setCatsError(null);

			try {
				const res = await api<CategoriesResponse>(
					`/categories` + qs({ include_counts: false }),
					{
						cache: 'no-store',
					},
				);

				if (cancelled) return;

				const opts: CategoryOption[] = (res.items ?? []).map((c) => ({
					value: c.id,
					label: `${c.name} (${c.id})`,
					raw: c,
				}));

				setCategoryOptions(opts);
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

	// Autofill selected values
	useEffect(() => {
		if (!courseOptions.length) return;
		setSelectedCourses(
			courseOptions.filter((o) => initialCourseIds.includes(o.value)),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [courseOptions.length, initialCourseIds.join(',')]);

	useEffect(() => {
		if (!categoryOptions.length) return;
		setSelectedCategories(
			categoryOptions.filter((o) => initialCategoryIds.includes(o.value)),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [categoryOptions.length, initialCategoryIds.join(',')]);

	// Image preview
	useEffect(() => {
		if (!imageFile) {
			setImagePreview(null);
			return;
		}
		const url = URL.createObjectURL(imageFile);
		setImagePreview(url);
		return () => URL.revokeObjectURL(url);
	}, [imageFile]);

	// Image pick with validation
	const MAX_IMAGE_MB = 5; // backend uses 5MB
	const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
	const ALLOWED_IMAGE_TYPES = new Set([
		'image/png',
		'image/jpeg',
		'image/webp',
	]);

	function onPickImage(file?: File | null) {
		if (!file) return;

		const nextErrors: FieldErrors = {};
		if (!file.type || !ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
			nextErrors.image = 'Image must be PNG, JPG, or WEBP.';
		}
		if (file.size > MAX_IMAGE_BYTES) {
			nextErrors.image = `Image too large (max ${MAX_IMAGE_MB}MB).`;
		}

		if (nextErrors.image) {
			setFieldErrors((p) => ({ ...p, ...nextErrors }));
			toast.error(nextErrors.image);
			return;
		}

		// selecting a new image cancels deletion of existing image
		setRemoveExistingImage(false);
		setFieldErrors((p) => ({ ...p, image: undefined }));
		setImageFile(file);
	}

	function openFilePicker() {
		const el = document.getElementById(
			'product-image',
		) as HTMLInputElement | null;
		el?.click();
	}

	// Validation
	function validate(): boolean {
		const next: FieldErrors = {};
		setFormError(null);

		const t = title.trim();
		const p = toNumber(price);

		if (!t) next.title = 'Title is required.';
		if (!Number.isFinite(p) || p <= 0)
			next.price = 'Price must be a number greater than 0.';

		const dpRaw = discountedPrice.trim();
		if (dpRaw !== '') {
			const dp = toNumber(dpRaw);
			if (!Number.isFinite(dp) || dp < 0) {
				next.discounted_price = 'Discounted price must be a valid number.';
			} else if (Number.isFinite(p) && dp > 0 && dp >= p) {
				next.discounted_price = 'Discounted price must be lower than price.';
			}
		}

		setFieldErrors((prev) => ({ ...prev, ...next }));
		return Object.keys(next).length === 0;
	}

	// Submit (PATCH /products/:id)
	async function onSave() {
		if (!validate()) {
			toast.error('Please fix the highlighted fields.');
			return;
		}

		setSaving(true);
		setFormError(null);

		try {
			const fd = new FormData();

			fd.append('title', title.trim());
			fd.append('price', String(toNumber(price)));
			fd.append('currency', currency);

			fd.append('identifier', identifier.trim() ? identifier.trim() : '');
			fd.append('description', description.trim() ? description.trim() : '');

			const dpRaw = discountedPrice.trim();
			if (dpRaw === '') fd.append('discounted_price', '');
			else {
				const dp = toNumber(dpRaw);
				fd.append(
					'discounted_price',
					Number.isFinite(dp) && dp > 0 ? String(dp) : '',
				);
			}

			fd.append('stock_status', stockStatus);

			fd.append('course_ids', jsonArrayString(selectedCourseIds));
			fd.append('category_ids', jsonArrayString(selectedCategoryIds));

			fd.append('is_published', isPublished ? 'true' : 'false');

			/**
			 * IMAGE behavior:
			 * - Upload new image: set imageFile (picked file) and Save (sends "image")
			 * - Remove image: toggle removeExistingImage and Save (sends image_url="")
			 * - Remove + upload new: just pick a new file after toggling remove (pick cancels remove)
			 *
			 * NOTE: "removeExistingImage" requires backend PATCH to accept image_url and clear when "".
			 */
			if (removeExistingImage) fd.append('image_url', '');
			if (imageFile) fd.append('image', imageFile, imageFile.name);

			const res = await fetch(`${baseUrl}/products/${productId}`, {
				method: 'PATCH',
				headers: { accept: 'application/json' },
				body: fd,
			});

			let data: any = null;
			try {
				data = await res.json();
			} catch {}

			if (!res.ok) {
				setFieldErrors((prev) => ({ image: prev.image }));

				if (res.status === 422 && data) {
					const mapped = mapFastApi422ToFieldErrors(data);
					const msg = extractApiErrorMessage(data) ?? 'Validation error.';
					setFieldErrors((prev) => ({ ...prev, ...mapped }));
					setFormError(msg);
					toast.error(msg);
					throw new Error(msg);
				}

				const msg =
					extractApiErrorMessage(data) ??
					`Failed to update product (HTTP ${res.status}).`;

				if (res.status === 409 && isAlreadyExists409(data)) {
					setFormError(msg);
					setFieldErrors((prev) => ({ ...prev, title: msg }));
					toast.error(msg);
					throw new Error(msg);
				}

				setFormError(msg);
				toast.error(msg);
				throw new Error(msg);
			}

			const p = normalizeProductResponse(data);
			if (p) {
				setExistingImageUrl(p.image_url ?? null);
				setRemoveExistingImage(false);
				setImageFile(null);

				if (typeof p.is_published === 'boolean') setIsPublished(p.is_published);
				if (p.price != null) setPrice(String(p.price));
				setDiscountedPrice(
					p.discounted_price == null ? '' : String(p.discounted_price),
				);
			}

			toast.success('Product updated successfully!');
			router.refresh();
		} catch (e: any) {
			setFormError(e?.message ?? 'Failed to update product.');
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

	// selected file preview wins; else existing url
	const previewSrc = imagePreview ?? existingImageUrl;

	return (
		<main className='mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8'>
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
							Edit Product
						</h1>
						<div className='mt-1 text-xs font-semibold text-slate-500'>
							ID: {Number.isFinite(productId) ? productId : '—'}
						</div>
					</div>
				</div>

				<button
					type='button'
					onClick={onSave}
					disabled={saving || loadingProduct}
					className={clsx(
						'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm',
						saving || loadingProduct
							? 'bg-blue-400'
							: 'bg-primary hover:bg-blue-700',
					)}
				>
					{saving ? <ButtonSpinner /> : <FiSave />}
					{saving ? 'Saving...' : 'Save changes'}
				</button>
			</div>

			{productError ? (
				<div className='mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700'>
					<div className='flex items-start gap-2'>
						<FiAlertTriangle className='mt-0.5' />
						<div>{productError}</div>
					</div>
				</div>
			) : null}

			{formError ? (
				<div className='mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700'>
					<div className='flex items-start gap-2'>
						<FiAlertTriangle className='mt-0.5' />
						<div>{formError}</div>
					</div>
				</div>
			) : null}

			<div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12'>
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
									if (fieldErrors.discounted_price) {
										setFieldErrors((p) => ({
											...p,
											discounted_price: undefined,
										}));
									}
									if (formError) setFormError(null);
								}}
								placeholder='0.00'
								error={fieldErrors.discounted_price}
							/>
						</div>

						{priceHint && priceHint.includes('lower') ? (
							<div className='mt-4 inline-flex items-center gap-2 rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700'>
								<FiAlertTriangle />
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
							isLoading={catsLoading || loadingProduct}
							options={categoryOptions}
							value={selectedCategories}
							onChange={(vals) => {
								setSelectedCategories(vals);
								if (formError) setFormError(null);
								if (fieldErrors.category_ids)
									setFieldErrors((p) => ({ ...p, category_ids: undefined }));
							}}
							placeholder='Search categories...'
							noOptionsMessage={() =>
								catsLoading ? 'Loading...' : 'No categories found'
							}
							error={catsError || fieldErrors.category_ids}
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
							isLoading={coursesLoading || loadingProduct}
							options={courseOptions}
							value={selectedCourses}
							onChange={(vals) => {
								setSelectedCourses(vals);
								if (formError) setFormError(null);
								if (fieldErrors.course_ids)
									setFieldErrors((p) => ({ ...p, course_ids: undefined }));
							}}
							placeholder='Search Moodle course ID or name...'
							noOptionsMessage={() =>
								coursesLoading ? 'Loading...' : 'No courses found'
							}
							error={coursesError || fieldErrors.course_ids}
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

				<div className='lg:col-span-4 space-y-6'>
					<CardShell
						title='Product Image'
						subtitle={`Upload, replace, or remove the product thumbnail. PNG/JPG/WEBP (max ${MAX_IMAGE_MB}MB).`}
					>
						<div
							onDragOver={(e) => e.preventDefault()}
							onDrop={(e) => {
								e.preventDefault();
								const f = e.dataTransfer.files?.[0];
								if (f) onPickImage(f);
							}}
							className={clsx(
								'rounded-2xl border border-dashed bg-slate-50 p-4',
								fieldErrors.image ? 'border-rose-300' : 'border-slate-300',
							)}
						>
							<input
								type='file'
								accept='image/png,image/jpeg,image/webp'
								className='hidden'
								id='product-image'
								onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
							/>

							{previewSrc ? (
								<div className='relative h-[220px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white'>
									<Image
										src={previewSrc}
										alt='Product preview'
										fill
										className='object-cover'
										unoptimized
									/>

									<div className='absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-white/85 px-3 py-2 backdrop-blur'>
										<div className='truncate text-xs font-extrabold text-slate-700'>
											{imageFile?.name
												? `Selected: ${imageFile.name}`
												: removeExistingImage
													? 'Current image will be removed'
													: 'Current image'}
										</div>

										<div className='flex items-center gap-2'>
											{/* Upload/Replace */}
											<button
												type='button'
												onClick={openFilePicker}
												className='inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50'
											>
												<FiRefreshCw />
												{imageFile ? 'Change' : 'Replace'}
											</button>

											{/* Remove selected file (only clears local selection) */}
											{imageFile ? (
												<button
													type='button'
													onClick={() => {
														setImageFile(null);
														setFieldErrors((p) => ({ ...p, image: undefined }));
													}}
													className='inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50'
												>
													<FiX />
													Selected
												</button>
											) : null}

											{/* Remove current stored image (DB) */}
											{existingImageUrl ? (
												<button
													type='button'
													onClick={() => {
														setRemoveExistingImage((v) => !v);
														// removing stored image should not keep a selected upload
														setImageFile(null);
														setFieldErrors((p) => ({ ...p, image: undefined }));
													}}
													className={clsx(
														'inline-flex h-8 items-center gap-1 rounded-xl border px-2 text-xs font-extrabold',
														removeExistingImage
															? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
															: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
													)}
												>
													<FiX />
													Remove
												</button>
											) : null}
										</div>
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
										PNG, JPG or WEBP (MAX {MAX_IMAGE_MB}MB)
									</div>
								</label>
							)}

							{removeExistingImage ? (
								<div className='mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-extrabold text-rose-700'>
									This product image will be removed when you save. To replace
									it instead, click “Replace” and choose a new image.
								</div>
							) : null}

							{fieldErrors.image ? (
								<div className='mt-3 text-xs font-extrabold text-rose-700'>
									{fieldErrors.image}
								</div>
							) : null}
						</div>
					</CardShell>

					<CardShell title='Visibility'>
						<Toggle
							checked={isPublished}
							onChange={(v) => {
								setIsPublished(v);
								if (formError) setFormError(null);
								if (fieldErrors.is_published)
									setFieldErrors((p) => ({ ...p, is_published: undefined }));
							}}
							label='Is published'
						/>
						<div className='mt-3 text-[11px] font-base text-slate-500'>
							Sends <span className='font-extrabold'>is_published</span> in the
							update request.
						</div>
						{fieldErrors.is_published ? (
							<div className='mt-2 text-xs font-extrabold text-rose-700'>
								{fieldErrors.is_published}
							</div>
						) : null}
					</CardShell>
				</div>
			</div>

			<LoadingOverlay
				show={saving || loadingProduct}
				title={saving ? 'Saving product…' : 'Loading product…'}
				message={
					saving
						? 'Uploading changes and validating data.'
						: 'Fetching latest product details.'
				}
			/>
		</main>
	);
}
