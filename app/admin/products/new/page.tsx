'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
	FiArrowLeft,
	FiUploadCloud,
	FiX,
	FiSave,
	FiTag,
	FiPlus,
	FiTrash2,
	FiAlertTriangle,
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

import RichTextEditor from '@/app/components/RichTextEditor';

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

type FieldErrors = {
	title?: string;
	price?: string;
	discounted_price?: string;
	image?: string;
	course_ids?: string;
	category_ids?: string;
	learning_outcomes?: string;

	// ✅ NEW
	long_description_html?: string;
};

function toNumber(value: string): number {
	const n = Number(String(value ?? '').trim());
	return Number.isFinite(n) ? n : NaN;
}

function extractApiErrorMessage(data: any): string | null {
	if (!data) return null;

	if (typeof data.detail === 'string') return data.detail;

	if (Array.isArray(data.detail) && data.detail[0]?.msg) {
		return data.detail[0].msg as string;
	}

	if (data.detail && typeof data.detail === 'object') {
		if (typeof data.detail.message === 'string') return data.detail.message;
	}

	if (typeof data.message === 'string') return data.message;
	return null;
}

function isAlreadyExists409(data: any): boolean {
	const msg = extractApiErrorMessage(data)?.toLowerCase() ?? '';
	return (
		msg.includes('already exists') ||
		msg.includes('exists') ||
		msg.includes('already')
	);
}

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
		if (key === 'course_ids') out.course_ids = msg;
		if (key === 'category_ids') out.category_ids = msg;
		if (key === 'learning_outcomes') out.learning_outcomes = msg;
		if (key === 'image') out.image = msg;

		// ✅ NEW
		if (key === 'long_description_html') out.long_description_html = msg;
	}

	return out;
}

function jsonArrayString(ids: number[]): string {
	return JSON.stringify(ids ?? []);
}

function jsonStringArrayString(items: string[]): string {
	return JSON.stringify(items ?? []);
}

function ButtonSpinner() {
	return (
		<span className='inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white' />
	);
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

	// ✅ NEW: HTML long description
	const [longDescriptionHtml, setLongDescriptionHtml] = useState('<p></p>');

	// fixed for now
	const currency = 'usd';
	const stockStatus: 'available' | 'not_available' = 'available';

	// ✅ What you'll learn
	const [learningOutcomes, setLearningOutcomes] = useState<string[]>([]);
	const [newOutcome, setNewOutcome] = useState('');

	// image
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	// saving
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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

	// Image pick with validation
	const MAX_IMAGE_MB = 5;
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

		setFieldErrors((p) => ({ ...p, image: undefined }));
		setImageFile(file);
	}

	function onDrop(e: React.DragEvent) {
		e.preventDefault();
		const f = e.dataTransfer.files?.[0];
		if (f) onPickImage(f);
	}

	function openFilePicker() {
		const el = document.getElementById(
			'product-image',
		) as HTMLInputElement | null;
		el?.click();
	}

	// -----------------------------
	// Outcomes helpers
	// -----------------------------
	function addOutcome() {
		const t = newOutcome.trim();
		if (!t) return;

		if (t.length > 220) {
			toast.error('Each learning outcome must be 220 characters or less.');
			setFieldErrors((p) => ({
				...p,
				learning_outcomes: 'Outcome too long (max 220 chars).',
			}));
			return;
		}

		setLearningOutcomes((prev) => {
			const merged = [...prev, t];
			const uniq: string[] = [];
			for (const s of merged) if (!uniq.includes(s)) uniq.push(s);
			return uniq;
		});

		setNewOutcome('');
		setFieldErrors((p) => ({ ...p, learning_outcomes: undefined }));
		if (formError) setFormError(null);
	}

	function removeOutcome(index: number) {
		setLearningOutcomes((prev) => prev.filter((_, i) => i !== index));
		setFieldErrors((p) => ({ ...p, learning_outcomes: undefined }));
		if (formError) setFormError(null);
	}

	function moveOutcome(index: number, dir: -1 | 1) {
		setLearningOutcomes((prev) => {
			const next = [...prev];
			const j = index + dir;
			if (j < 0 || j >= next.length) return prev;
			const tmp = next[index];
			next[index] = next[j];
			next[j] = tmp;
			return next;
		});
	}

	// -----------------------------
	// Validation
	// -----------------------------
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

		if (learningOutcomes.some((x) => String(x).trim().length > 220)) {
			next.learning_outcomes = 'Each outcome must be 220 characters or less.';
		}

		// ✅ NEW: client-side limit aligned with backend default
		if ((longDescriptionHtml || '').length > 50_000) {
			next.long_description_html =
				'Long description is too large (max 50,000 chars).';
		}

		setFieldErrors((prev) => ({ ...prev, ...next }));
		return Object.keys(next).length === 0;
	}

	// -----------------------------
	// Submit
	// -----------------------------
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

			// ✅ NEW: send rich HTML
			// If you want "empty clears", send "" when empty
			fd.append(
				'long_description_html',
				(longDescriptionHtml || '').trim() ? longDescriptionHtml : '',
			);

			const dpRaw = discountedPrice.trim();
			if (dpRaw !== '') {
				const dp = toNumber(dpRaw);
				fd.append(
					'discounted_price',
					Number.isFinite(dp) && dp > 0 ? String(dp) : '',
				);
			} else {
				fd.append('discounted_price', '');
			}

			fd.append('stock_status', stockStatus);

			fd.append('course_ids', jsonArrayString(selectedCourseIds));
			fd.append('category_ids', jsonArrayString(selectedCategoryIds));

			fd.append('learning_outcomes', jsonStringArrayString(learningOutcomes));

			if (imageFile) {
				fd.append('image', imageFile, imageFile.name);
			}

			const baseUrl =
				process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
			const res = await fetch(`${baseUrl}/products`, {
				method: 'POST',
				headers: { accept: 'application/json' },
				body: fd,
			});

			let data: any = null;
			try {
				data = await res.json();
			} catch {}

			if (!res.ok) {
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
					`Failed to create product (HTTP ${res.status}).`;

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

			toast.success('Product created successfully!');
			const createdId = data?.product?.id;
			if (createdId) router.push(`/admin/products/${createdId}`);
			else router.push(`/admin/products`);
		} catch (e: any) {
			setFormError(e?.message ?? 'Failed to create product.');
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
					<button
						type='button'
						onClick={onSave}
						disabled={saving}
						className={clsx(
							'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm',
							saving ? 'bg-blue-400' : 'bg-primary hover:bg-blue-700',
						)}
					>
						{saving ? <ButtonSpinner /> : <FiSave />}
						{saving ? 'Saving...' : 'Save'}
					</button>
				</div>
			</div>

			{formError ? (
				<div className='mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700'>
					<div className='flex items-start gap-2'>
						<FiAlertTriangle className='mt-0.5' />
						<div>{formError}</div>
					</div>
				</div>
			) : null}

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
								label='Short Description'
								value={description}
								onChange={(v) => {
									setDescription(v);
									if (formError) setFormError(null);
								}}
								placeholder='Short description...'
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

					{/* ✅ NEW: Long HTML description */}
					<CardShell
						title='Long Description'
						subtitle='Rich content (HTML) rendered on the product page (headings, lists, links, etc.).'
					>
						<div className='space-y-4'>
							<RichTextEditor
								value={longDescriptionHtml}
								onChange={(html) => {
									setLongDescriptionHtml(html);
									if (fieldErrors.long_description_html)
										setFieldErrors((p) => ({
											...p,
											long_description_html: undefined,
										}));
									if (formError) setFormError(null);
								}}
								fullPage
								error={fieldErrors.long_description_html}
								heightClassName='h-[calc(100vh-260px)]'
								maxChars={50000}
							/>
						</div>
					</CardShell>

					{/* What you'll learn */}
					<CardShell
						title="What you'll learn"
						subtitle='Add bullet points shown on the product page.'
					>
						<div className='space-y-3'>
							<div className='flex flex-col gap-2 sm:flex-row sm:items-start'>
								<div className='flex-1'>
									<input
										value={newOutcome}
										onChange={(e) => {
											setNewOutcome(e.target.value);
											if (fieldErrors.learning_outcomes)
												setFieldErrors((p) => ({
													...p,
													learning_outcomes: undefined,
												}));
											if (formError) setFormError(null);
										}}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												addOutcome();
											}
										}}
										placeholder='e.g., Build 16 web development projects for your portfolio'
										className={clsx(
											'w-full rounded-xl border bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none',
											fieldErrors.learning_outcomes
												? 'border-rose-300 focus:border-rose-400'
												: 'border-slate-200 focus:border-slate-300',
										)}
									/>
									<div className='mt-1 text-[11px] font-medium text-slate-500'>
										Press Enter to add. Max 220 chars each. (
										{newOutcome.trim().length}/220)
									</div>
								</div>

								<button
									type='button'
									onClick={addOutcome}
									className='inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-extrabold text-white hover:bg-slate-800'
								>
									<FiPlus />
									Add
								</button>
							</div>

							{fieldErrors.learning_outcomes ? (
								<div className='text-xs font-extrabold text-rose-700'>
									{fieldErrors.learning_outcomes}
								</div>
							) : null}

							<div className='rounded-2xl border border-slate-200 bg-white'>
								{learningOutcomes.length === 0 ? (
									<div className='p-4 text-sm font-medium text-slate-500'>
										No items yet. Add your first learning outcome above.
									</div>
								) : (
									<ul className='divide-y divide-slate-100'>
										{learningOutcomes.map((item, idx) => (
											<li
												key={`${item}-${idx}`}
												className='flex items-start gap-3 p-3'
											>
												<div className='mt-1 h-2 w-2 rounded-full bg-slate-300' />
												<div className='flex-1'>
													<div className='text-sm font-semibold text-slate-900'>
														{item}
													</div>
													<div className='mt-1 text-[11px] font-semibold text-slate-500'>
														{item.length}/220
													</div>
												</div>

												<div className='flex items-center gap-1'>
													<button
														type='button'
														onClick={() => moveOutcome(idx, -1)}
														disabled={idx === 0}
														className={clsx(
															'rounded-xl border px-2 py-1 text-xs font-extrabold',
															idx === 0
																? 'cursor-not-allowed border-slate-200 text-slate-300'
																: 'border-slate-200 text-slate-700 hover:bg-slate-50',
														)}
													>
														↑
													</button>
													<button
														type='button'
														onClick={() => moveOutcome(idx, 1)}
														disabled={idx === learningOutcomes.length - 1}
														className={clsx(
															'rounded-xl border px-2 py-1 text-xs font-extrabold',
															idx === learningOutcomes.length - 1
																? 'cursor-not-allowed border-slate-200 text-slate-300'
																: 'border-slate-200 text-slate-700 hover:bg-slate-50',
														)}
													>
														↓
													</button>
													<button
														type='button'
														onClick={() => removeOutcome(idx)}
														className='inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-extrabold text-rose-700 hover:bg-rose-100'
													>
														<FiTrash2 />
														Remove
													</button>
												</div>
											</li>
										))}
									</ul>
								)}
							</div>
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

				{/* Right */}
				<div className='lg:col-span-4 space-y-6'>
					<CardShell
						title='Product Image'
						subtitle={`Optional: upload a thumbnail. PNG/JPG/WEBP (max ${MAX_IMAGE_MB}MB).`}
					>
						<div
							onDragOver={(e) => e.preventDefault()}
							onDrop={onDrop}
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
										<div className='flex items-center gap-2'>
											<button
												type='button'
												onClick={() => openFilePicker()}
												className='inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50'
											>
												<FiUploadCloud />
												Change
											</button>
											<button
												type='button'
												onClick={() => {
													setImageFile(null);
													setFieldErrors((p) => ({ ...p, image: undefined }));
												}}
												className='inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-xs font-extrabold text-slate-700 hover:bg-slate-50'
											>
												<FiX />
												Remove
											</button>
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

							{fieldErrors.image ? (
								<div className='mt-3 text-xs font-extrabold text-rose-700'>
									{fieldErrors.image}
								</div>
							) : null}
						</div>
					</CardShell>
				</div>
			</div>
		</main>
	);
}
