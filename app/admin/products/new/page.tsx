// 'use client';

// import { useEffect, useMemo, useState } from 'react';
// import Link from 'next/link';
// import Select, { MultiValue } from 'react-select';
// import {
// 	FiArrowLeft,
// 	FiUploadCloud,
// 	FiX,
// 	FiCheck,
// 	FiSave,
// 	FiEye,
// 	FiTag,
// } from 'react-icons/fi';
// import { api, qs } from '@/lib/api/api';

// function clsx(...parts: Array<string | false | null | undefined>) {
// 	return parts.filter(Boolean).join(' ');
// }

// /** Moodle courses */
// type MoodleCourse = {
// 	id: number;
// 	fullname?: string;
// 	shortname?: string;
// 	name?: string;
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
// 	label: string; // "Medicine (8)"
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
// 	label: string; // "Programming (12)" or just "Programming"
// 	raw: Category;
// };

// function CardShell({
// 	title,
// 	subtitle,
// 	right,
// 	children,
// }: {
// 	title: string;
// 	subtitle?: string;
// 	right?: React.ReactNode;
// 	children: React.ReactNode;
// }) {
// 	return (
// 		<div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>
// 			<div className='flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between'>
// 				<div>
// 					<div className='text-sm font-extrabold text-slate-900'>{title}</div>
// 					{subtitle && (
// 						<div className='mt-1 text-xs font-semibold text-slate-500'>
// 							{subtitle}
// 						</div>
// 					)}
// 				</div>
// 				{right}
// 			</div>
// 			<div className='p-5'>{children}</div>
// 		</div>
// 	);
// }

// function FieldLabel({
// 	children,
// 	hint,
// }: {
// 	children: React.ReactNode;
// 	hint?: string;
// }) {
// 	return (
// 		<div className='mb-2'>
// 			<div className='text-xs font-extrabold text-slate-700'>{children}</div>
// 			{hint && (
// 				<div className='mt-1 text-[11px] font-semibold text-slate-400'>
// 					{hint}
// 				</div>
// 			)}
// 		</div>
// 	);
// }

// function Toggle({
// 	checked,
// 	onChange,
// 	label,
// }: {
// 	checked: boolean;
// 	onChange: (v: boolean) => void;
// 	label?: string;
// }) {
// 	return (
// 		<div className='flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
// 			<div className='min-w-0'>
// 				<div className='text-sm font-extrabold text-slate-900'>
// 					{label ?? 'Is published'}
// 				</div>
// 				<div className='mt-0.5 text-xs font-semibold text-slate-500'>
// 					Control whether this product is visible in your marketplace.
// 				</div>
// 			</div>

// 			<button
// 				type='button'
// 				onClick={() => onChange(!checked)}
// 				className={clsx(
// 					'relative inline-flex h-8 w-14 items-center rounded-full transition-colors',
// 					checked ? 'bg-blue-600' : 'bg-slate-200'
// 				)}
// 				aria-pressed={checked}
// 				aria-label='Toggle published'
// 			>
// 				<span
// 					className={clsx(
// 						'inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform',
// 						checked ? 'translate-x-7' : 'translate-x-1'
// 					)}
// 				/>
// 			</button>
// 		</div>
// 	);
// }

// export default function AdminNewProductPage() {
// 	// ✅ Fix hydration mismatch: render react-select only after mount
// 	const [mounted, setMounted] = useState(false);
// 	useEffect(() => setMounted(true), []);

// 	// -----------------------------
// 	// Form state (used for create & edit)
// 	// -----------------------------
// 	const [title, setTitle] = useState('');
// 	const [description, setDescription] = useState('');
// 	const [identifier, setIdentifier] = useState('');
// 	const [regularPrice, setRegularPrice] = useState('');
// 	const [discountPrice, setDiscountPrice] = useState('');
// 	const [published, setPublished] = useState(true);

// 	// image (client preview)
// 	const [imageFile, setImageFile] = useState<File | null>(null);
// 	const [imagePreview, setImagePreview] = useState<string | null>(null);

// 	// -----------------------------
// 	// Courses (react-select multi)
// 	// -----------------------------
// 	const [coursesLoading, setCoursesLoading] = useState(false);
// 	const [coursesError, setCoursesError] = useState<string | null>(null);
// 	const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
// 	const [selectedCourses, setSelectedCourses] = useState<CourseOption[]>([]);
// 	const selectedCourseIds = selectedCourses.map((c) => c.value);

// 	// -----------------------------
// 	// Categories (react-select multi)
// 	// -----------------------------
// 	const [catsLoading, setCatsLoading] = useState(false);
// 	const [catsError, setCatsError] = useState<string | null>(null);
// 	const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
// 	const [selectedCategories, setSelectedCategories] = useState<
// 		CategoryOption[]
// 	>([]);
// 	const selectedCategoryIds = selectedCategories.map((c) => c.value);

// 	// -----------------------------
// 	// Shared react-select styles
// 	// -----------------------------
// 	const selectStyles = useMemo(
// 		() => ({
// 			control: (base: any, state: any) => ({
// 				...base,
// 				borderRadius: 16,
// 				borderColor: state.isFocused ? '#93c5fd' : '#e2e8f0',
// 				boxShadow: state.isFocused
// 					? '0 0 0 4px rgba(59, 130, 246, 0.10)'
// 					: '0 1px 2px rgba(15, 23, 42, 0.06)',
// 				backgroundColor: '#fff',
// 				minHeight: 48,
// 				paddingLeft: 6,
// 				paddingRight: 6,
// 				':hover': { borderColor: '#e2e8f0' },
// 			}),
// 			valueContainer: (base: any) => ({
// 				...base,
// 				padding: '2px 6px',
// 			}),
// 			input: (base: any) => ({
// 				...base,
// 				margin: 0,
// 				padding: 0,
// 				fontWeight: 600,
// 				color: '#0f172a',
// 			}),
// 			placeholder: (base: any) => ({
// 				...base,
// 				fontWeight: 600,
// 				color: '#94a3b8',
// 			}),
// 			multiValue: (base: any) => ({
// 				...base,
// 				borderRadius: 9999,
// 				backgroundColor: 'rgb(255 251 235)',
// 				border: '1px solid rgb(253 230 138)',
// 			}),
// 			multiValueLabel: (base: any) => ({
// 				...base,
// 				fontWeight: 800,
// 				fontSize: 11,
// 				color: 'rgb(180 83 9)',
// 				padding: '3px 8px',
// 			}),
// 			multiValueRemove: (base: any) => ({
// 				...base,
// 				borderRadius: 9999,
// 				marginRight: 4,
// 				color: 'rgb(180 83 9)',
// 				':hover': {
// 					backgroundColor: 'rgb(254 243 199)',
// 					color: 'rgb(180 83 9)',
// 				},
// 			}),
// 			menu: (base: any) => ({
// 				...base,
// 				borderRadius: 16,
// 				overflow: 'hidden',
// 				border: '1px solid #e2e8f0',
// 				boxShadow:
// 					'0 12px 30px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06)',
// 			}),
// 			option: (base: any, state: any) => ({
// 				...base,
// 				fontSize: 13,
// 				fontWeight: 700,
// 				color: '#0f172a',
// 				backgroundColor: state.isFocused ? 'rgb(248 250 252)' : '#fff',
// 				':active': { backgroundColor: 'rgb(239 246 255)' },
// 			}),
// 		}),
// 		[]
// 	);

// 	// -----------------------------
// 	// Load moodle courses (client)
// 	// -----------------------------
// 	useEffect(() => {
// 		let cancelled = false;

// 		async function loadCourses() {
// 			setCoursesLoading(true);
// 			setCoursesError(null);

// 			try {
// 				const res = await api<MoodleCoursesResponse>(
// 					`/integrations/moodle/courses` +
// 						qs({ page: 1, page_size: 50, only_linked: false }),
// 					{ cache: 'no-store' }
// 				);

// 				if (cancelled) return;

// 				const opts: CourseOption[] = (res.items ?? []).map((c) => {
// 					const name = c.fullname ?? c.name ?? c.shortname ?? `Course ${c.id}`;
// 					return {
// 						value: c.id,
// 						label: `${name} (${c.id})`,
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
// 	// Load categories (client)
// 	// -----------------------------
// 	useEffect(() => {
// 		let cancelled = false;

// 		async function loadCategories() {
// 			setCatsLoading(true);
// 			setCatsError(null);

// 			try {
// 				// ✅ change this endpoint to your real one:
// 				// If your /products/paged returns categories somewhere, you likely have:
// 				// GET /categories/paged?page=1&page_size=50
// 				const res = await api<CategoriesResponse>(
// 					`/categories/paged` + qs({ page: 1, page_size: 50 }),
// 					{ cache: 'no-store' }
// 				);

// 				if (cancelled) return;

// 				const opts: CategoryOption[] = (res.items ?? []).map((c) => ({
// 					value: c.id,
// 					label: c.name, // keep clean (or `${c.name} (${c.id})` if you want)
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
// 	// Image handling (preview)
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

// 	function onPickImage(file?: File | null) {
// 		if (!file) return;
// 		if (!file.type.startsWith('image/')) return;
// 		setImageFile(file);
// 	}

// 	function onDrop(e: React.DragEvent) {
// 		e.preventDefault();
// 		const f = e.dataTransfer.files?.[0];
// 		if (f) onPickImage(f);
// 	}

// 	// -----------------------------
// 	// Save (wire to backend later)
// 	// -----------------------------
// 	async function onSave() {
// 		const payload = {
// 			title,
// 			description,
// 			identifier,
// 			regular_price: regularPrice,
// 			discount_price: discountPrice || null,
// 			category_ids: selectedCategoryIds,
// 			moodle_course_ids: selectedCourseIds,
// 			published,
// 		};

// 		console.log('SAVE PRODUCT PAYLOAD', payload);
// 		alert('Check console for payload. Hook this to your backend POST.');
// 	}

// 	const priceHint = useMemo(() => {
// 		if (!regularPrice || !discountPrice) return null;
// 		const r = Number(regularPrice);
// 		const d = Number(discountPrice);
// 		if (!Number.isFinite(r) || !Number.isFinite(d)) return null;
// 		if (d >= r) return 'Discount should be lower than regular price.';
// 		const pct = Math.round(((r - d) / r) * 100);
// 		return `Discount: ${pct}% off`;
// 	}, [regularPrice, discountPrice]);

// 	return (
// 		<main className='mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8'>
// 			{/* Top header */}
// 			<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
// 				<div className='flex items-start gap-3'>
// 					<Link
// 						href='/admin/catalog'
// 						className='mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
// 						aria-label='Back'
// 					>
// 						<FiArrowLeft />
// 					</Link>

// 					<div>
// 						<h1 className='text-2xl font-extrabold tracking-tight'>
// 							New Product
// 						</h1>
// 						<p className='mt-1 text-sm font-medium text-slate-500'>
// 							Create a product, categorize it, and link Moodle courses for
// 							auto-enrollment.
// 						</p>
// 					</div>
// 				</div>

// 				<div className='flex items-center gap-2'>
// 					<button
// 						type='button'
// 						className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50'
// 					>
// 						<FiEye />
// 						Preview
// 					</button>

// 					<button
// 						type='button'
// 						onClick={onSave}
// 						className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700'
// 					>
// 						<FiSave />
// 						Save
// 					</button>
// 				</div>
// 			</div>

// 			{/* Content grid */}
// 			<div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12'>
// 				{/* Left: main form */}
// 				<div className='lg:col-span-8 space-y-6'>
// 					<CardShell
// 						title='Product Information'
// 						subtitle='Core details shown on your marketplace product page.'
// 					>
// 						<div className='space-y-6'>
// 							<div>
// 								<FieldLabel hint='A clear name increases conversion.'>
// 									Product Title
// 								</FieldLabel>
// 								<input
// 									value={title}
// 									onChange={(e) => setTitle(e.target.value)}
// 									className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100'
// 									placeholder='Introduction to Data Science'
// 								/>
// 							</div>

// 							<div>
// 								<FieldLabel hint='Explain what the student gets and who it’s for.'>
// 									Product Description
// 								</FieldLabel>
// 								<textarea
// 									value={description}
// 									onChange={(e) => setDescription(e.target.value)}
// 									className='min-h-[140px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100'
// 									placeholder='Learn the basics of Data Science, from Python libraries to statistical analysis...'
// 								/>
// 								<div className='mt-2 text-[11px] font-semibold text-slate-400'>
// 									Rich text formatting enabled.
// 								</div>
// 							</div>

// 							<div>
// 								<FieldLabel hint='This is your internal identifier (SKU/slug). Keep it unique.'>
// 									Identifier
// 								</FieldLabel>
// 								<input
// 									value={identifier}
// 									onChange={(e) => setIdentifier(e.target.value)}
// 									className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100'
// 									placeholder='DS-INTRO-001'
// 								/>
// 							</div>
// 						</div>
// 					</CardShell>

// 					<CardShell
// 						title='Pricing'
// 						subtitle='Set your regular and discounted price.'
// 						right={
// 							priceHint && !priceHint.includes('lower') ? (
// 								<div className='inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700'>
// 									<FiCheck />
// 									{priceHint}
// 								</div>
// 							) : null
// 						}
// 					>
// 						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
// 							<div>
// 								<FieldLabel>Regular Price</FieldLabel>
// 								<div className='flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100'>
// 									<span className='text-sm font-extrabold text-slate-500'>
// 										$
// 									</span>
// 									<input
// 										value={regularPrice}
// 										onChange={(e) => setRegularPrice(e.target.value)}
// 										className='w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400'
// 										placeholder='150.00'
// 										inputMode='decimal'
// 									/>
// 								</div>
// 							</div>

// 							<div>
// 								<FieldLabel
// 									hint={
// 										priceHint && priceHint.includes('lower')
// 											? priceHint
// 											: undefined
// 									}
// 								>
// 									Discount Price
// 								</FieldLabel>
// 								<div className='flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100'>
// 									<span className='text-sm font-extrabold text-slate-500'>
// 										$
// 									</span>
// 									<input
// 										value={discountPrice}
// 										onChange={(e) => setDiscountPrice(e.target.value)}
// 										className='w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400'
// 										placeholder='120.00'
// 										inputMode='decimal'
// 									/>
// 								</div>
// 							</div>
// 						</div>

// 						{priceHint && priceHint.includes('lower') && (
// 							<div className='mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-extrabold text-rose-700'>
// 								{priceHint}
// 							</div>
// 						)}
// 					</CardShell>

// 					<CardShell
// 						title='Categories'
// 						subtitle='Add one or more categories to improve discovery.'
// 						right={
// 							<span className='inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200'>
// 								<FiTag />
// 								{selectedCategoryIds.length}
// 							</span>
// 						}
// 					>
// 						{!mounted ? (
// 							<div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500'>
// 								Loading selector…
// 							</div>
// 						) : (
// 							<>
// 								<Select
// 									instanceId='product-categories-select'
// 									inputId='product-categories-select-input'
// 									isMulti
// 									isLoading={catsLoading}
// 									options={categoryOptions}
// 									value={selectedCategories}
// 									onChange={(value: MultiValue<CategoryOption>) =>
// 										setSelectedCategories(value as CategoryOption[])
// 									}
// 									placeholder='Search categories...'
// 									noOptionsMessage={() =>
// 										catsLoading ? 'Loading...' : 'No categories found'
// 									}
// 									classNamePrefix='enrollait-select'
// 									styles={selectStyles}
// 									components={{ IndicatorSeparator: () => null }}
// 								/>

// 								{catsError && (
// 									<div className='mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-extrabold text-rose-700'>
// 										{catsError}
// 									</div>
// 								)}
// 							</>
// 						)}
// 					</CardShell>

// 					<CardShell
// 						title='Associate Courses'
// 						subtitle='Link Moodle courses to enroll buyers automatically.'
// 					>
// 						{!mounted ? (
// 							<div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500'>
// 								Loading selector…
// 							</div>
// 						) : (
// 							<>
// 								<Select
// 									instanceId='moodle-courses-select'
// 									inputId='moodle-courses-select-input'
// 									isMulti
// 									isLoading={coursesLoading}
// 									options={courseOptions}
// 									value={selectedCourses}
// 									onChange={(value: MultiValue<CourseOption>) =>
// 										setSelectedCourses(value as CourseOption[])
// 									}
// 									placeholder='Search Moodle course ID or name...'
// 									noOptionsMessage={() =>
// 										coursesLoading ? 'Loading...' : 'No courses found'
// 									}
// 									classNamePrefix='enrollait-select'
// 									styles={selectStyles}
// 									components={{ IndicatorSeparator: () => null }}
// 								/>

// 								{coursesError && (
// 									<div className='mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-extrabold text-rose-700'>
// 										{coursesError}
// 									</div>
// 								)}

// 								<div className='mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-extrabold text-slate-700'>
// 									Linked courses:{' '}
// 									<span className='text-slate-900'>
// 										{selectedCourseIds.length}
// 									</span>
// 								</div>
// 							</>
// 						)}
// 					</CardShell>
// 				</div>

// 				{/* Right column */}
// 				<div className='lg:col-span-4 space-y-6'>
// 					<CardShell
// 						title='Product Image'
// 						subtitle='Upload a thumbnail used across the catalog and checkout.'
// 					>
// 						<div
// 							onDragOver={(e) => e.preventDefault()}
// 							onDrop={onDrop}
// 							className='rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4'
// 						>
// 							<input
// 								type='file'
// 								accept='image/*'
// 								className='hidden'
// 								id='product-image'
// 								onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
// 							/>

// 							{imagePreview ? (
// 								<div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white'>
// 									<img
// 										src={imagePreview}
// 										alt='Product preview'
// 										className='h-[220px] w-full object-cover'
// 									/>
// 									<div className='absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-white/85 px-3 py-2 backdrop-blur'>
// 										<div className='truncate text-xs font-extrabold text-slate-700'>
// 											{imageFile?.name}
// 										</div>
// 										<button
// 											type='button'
// 											onClick={() => setImageFile(null)}
// 											className='inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
// 											aria-label='Remove image'
// 										>
// 											<FiX />
// 										</button>
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
// 										PNG, JPG or WEBP (MAX 2MB)
// 									</div>
// 								</label>
// 							)}
// 						</div>
// 					</CardShell>

// 					<CardShell
// 						title='Publishing'
// 						subtitle='Control whether users can see and purchase this product.'
// 					>
// 						<Toggle
// 							checked={published}
// 							onChange={setPublished}
// 							label='Is published'
// 						/>
// 					</CardShell>
// 				</div>
// 			</div>
// 		</main>
// 	);
// }

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Select, { MultiValue } from 'react-select';
import {
	FiArrowLeft,
	FiUploadCloud,
	FiX,
	FiCheck,
	FiSave,
	FiEye,
	FiTag,
	FiAlertTriangle,
} from 'react-icons/fi';
import { api, qs } from '@/lib/api/api';

function clsx(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(' ');
}

/** Moodle courses */
type MoodleCourse = {
	id: number;
	fullname?: string;
	shortname?: string;
	name?: string;
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

function FieldLabel({
	children,
	hint,
	required,
}: {
	children: React.ReactNode;
	hint?: string;
	required?: boolean;
}) {
	return (
		<div className='mb-2'>
			<div className='flex items-center gap-2 text-xs font-extrabold text-slate-700'>
				<span>{children}</span>
				{required && (
					<span className='rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-700'>
						Required
					</span>
				)}
			</div>
			{hint && (
				<div className='mt-1 text-[11px] font-semibold text-slate-400'>
					{hint}
				</div>
			)}
		</div>
	);
}

function Toggle({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: (v: boolean) => void;
	label?: string;
}) {
	return (
		<div className='flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
			<div className='min-w-0'>
				<div className='text-sm font-extrabold text-slate-900'>
					{label ?? 'Is published'}
				</div>
				<div className='mt-0.5 text-xs font-semibold text-slate-500'>
					Control whether this product is visible in your marketplace.
				</div>
			</div>

			<button
				type='button'
				onClick={() => onChange(!checked)}
				className={clsx(
					'relative inline-flex h-8 w-14 items-center rounded-full transition-colors',
					checked ? 'bg-blue-600' : 'bg-slate-200'
				)}
				aria-pressed={checked}
				aria-label='Toggle published'
			>
				<span
					className={clsx(
						'inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition-transform',
						checked ? 'translate-x-7' : 'translate-x-1'
					)}
				/>
			</button>
		</div>
	);
}

function toNumber(value: string): number {
	// allow "10", "10.5", "  10  "
	const n = Number(String(value ?? '').trim());
	return Number.isFinite(n) ? n : NaN;
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
	const [published, setPublished] = useState(true);

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

	// -----------------------------
	// Shared react-select styles
	// -----------------------------
	const selectStyles = useMemo(
		() => ({
			control: (base: any, state: any) => ({
				...base,
				borderRadius: 16,
				borderColor: state.isFocused ? '#93c5fd' : '#e2e8f0',
				boxShadow: state.isFocused
					? '0 0 0 4px rgba(59, 130, 246, 0.10)'
					: '0 1px 2px rgba(15, 23, 42, 0.06)',
				backgroundColor: '#fff',
				minHeight: 48,
				paddingLeft: 6,
				paddingRight: 6,
				':hover': { borderColor: '#e2e8f0' },
			}),
			valueContainer: (base: any) => ({
				...base,
				padding: '2px 6px',
			}),
			input: (base: any) => ({
				...base,
				margin: 0,
				padding: 0,
				fontWeight: 600,
				color: '#0f172a',
			}),
			placeholder: (base: any) => ({
				...base,
				fontWeight: 600,
				color: '#94a3b8',
			}),
			multiValue: (base: any) => ({
				...base,
				borderRadius: 9999,
				backgroundColor: 'rgb(255 251 235)',
				border: '1px solid rgb(253 230 138)',
			}),
			multiValueLabel: (base: any) => ({
				...base,
				fontWeight: 800,
				fontSize: 11,
				color: 'rgb(180 83 9)',
				padding: '3px 8px',
			}),
			multiValueRemove: (base: any) => ({
				...base,
				borderRadius: 9999,
				marginRight: 4,
				color: 'rgb(180 83 9)',
				':hover': {
					backgroundColor: 'rgb(254 243 199)',
					color: 'rgb(180 83 9)',
				},
			}),
			menu: (base: any) => ({
				...base,
				borderRadius: 16,
				overflow: 'hidden',
				border: '1px solid #e2e8f0',
				boxShadow:
					'0 12px 30px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06)',
			}),
			option: (base: any, state: any) => ({
				...base,
				fontSize: 13,
				fontWeight: 700,
				color: '#0f172a',
				backgroundColor: state.isFocused ? 'rgb(248 250 252)' : '#fff',
				':active': { backgroundColor: 'rgb(239 246 255)' },
			}),
		}),
		[]
	);

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
					`/integrations/moodle/courses` +
						qs({ page: 1, page_size: 50, only_linked: false }),
					{ cache: 'no-store' }
				);

				if (cancelled) return;

				const opts: CourseOption[] = (res.items ?? []).map((c) => {
					const name = c.fullname ?? c.name ?? c.shortname ?? `Course ${c.id}`;
					return { value: c.id, label: `${name} (${c.id})`, raw: c };
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
				// ✅ replace if your backend uses a different endpoint
				const res = await api<CategoriesResponse>(
					`/categories/paged` + qs({ page: 1, page_size: 50 }),
					{ cache: 'no-store' }
				);

				if (cancelled) return;

				const opts: CategoryOption[] = (res.items ?? []).map((c) => ({
					value: c.id,
					label: c.name,
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
	// Validation (only required: title + price)
	// discounted_price > 0 => must be lower than price
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
	// Submit: multipart/form-data to POST /products
	// Matches your curl keys:
	// identifier, price, discounted_price, currency, course_ids, category_ids,
	// title, stock_status, description, image
	// -----------------------------
	async function onSave() {
		if (!validate()) return;

		setSaving(true);
		setFormError(null);

		try {
			const fd = new FormData();
			fd.append('title', title.trim());

			// required field
			fd.append('price', String(toNumber(price)));

			// optional fields
			fd.append('currency', currency);

			if (identifier.trim()) fd.append('identifier', identifier.trim());
			if (description.trim()) fd.append('description', description.trim());

			const dpRaw = discountedPrice.trim();
			if (dpRaw !== '') {
				const dp = toNumber(dpRaw);
				// send empty string if 0? your curl sends empty when not provided.
				// Here we send number if provided at all.
				fd.append('discounted_price', dp > 0 ? String(dp) : '');
			} else {
				fd.append('discounted_price', '');
			}

			fd.append('stock_status', stockStatus);

			// arrays (best practice: repeat field name)
			if (selectedCourseIds.length === 0) {
				// match your curl (empty string)
				fd.append('course_ids', '');
			} else {
				// selectedCourseIds.forEach((id) => fd.append('course_ids', String(id)));
				fd.append('course_ids', `[${selectedCourseIds.join(',')}]`);
			}

			if (selectedCategoryIds.length === 0) {
				fd.append('category_ids', '');
			} else {
				selectedCategoryIds.forEach((id) =>
					fd.append('category_ids', String(id))
				);
			}

			if (imageFile) {
				fd.append('image', imageFile, imageFile.name);
			} else {
				// don't append at all if none (most backends accept missing file)
				// your curl includes it; but missing is usually fine.
			}

			// NOTE: "published" is not in your curl.
			// If your backend supports it, uncomment:
			// fd.append('published', String(published));

			// Use native fetch for multipart (avoid manually setting Content-Type boundary)
			const baseUrl =
				process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
			const res = await fetch(`${baseUrl}/products`, {
				method: 'POST',
				headers: {
					accept: 'application/json',
				},
				body: fd,
			});

			if (!res.ok) {
				let msg = `Failed to create product (HTTP ${res.status}).`;
				try {
					const data = await res.json();
					msg = data?.detail || data?.message || msg;
				} catch {
					// ignore
				}
				throw new Error(msg);
			}

			const created = await res.json();
			console.log('CREATED PRODUCT', created);

			// redirect or toast as you like
			alert('Product created!');
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
						href='/admin/catalog'
						className='mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'
						aria-label='Back'
					>
						<FiArrowLeft />
					</Link>

					<div>
						<h1 className='text-2xl font-extrabold tracking-tight'>
							New Product
						</h1>
						<p className='mt-1 text-sm font-medium text-slate-500'>
							Only <span className='font-extrabold text-slate-900'>title</span>{' '}
							and <span className='font-extrabold text-slate-900'>price</span>{' '}
							are required.
						</p>
					</div>
				</div>

				<div className='flex items-center gap-2'>
					<button
						type='button'
						className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50'
					>
						<FiEye />
						Preview
					</button>

					<button
						type='button'
						onClick={onSave}
						disabled={saving}
						className={clsx(
							'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm',
							saving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
						)}
					>
						<FiSave />
						{saving ? 'Saving...' : 'Save'}
					</button>
				</div>
			</div>

			{formError && (
				<div className='mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700'>
					<div className='flex items-start gap-2'>
						<FiAlertTriangle className='mt-0.5' />
						<div>{formError}</div>
					</div>
				</div>
			)}

			{/* Content grid */}
			<div className='mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12'>
				{/* Left */}
				<div className='lg:col-span-8 space-y-6'>
					<CardShell
						title='Product Information'
						subtitle='Core details shown on your marketplace product page.'
					>
						<div className='space-y-6'>
							<div>
								<FieldLabel required hint='A clear name increases conversion.'>
									Product Title
								</FieldLabel>
								<input
									value={title}
									onChange={(e) => {
										setTitle(e.target.value);
										if (fieldErrors.title)
											setFieldErrors((p) => ({ ...p, title: undefined }));
									}}
									className={clsx(
										'w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-4',
										fieldErrors.title
											? 'border-rose-300 focus:border-rose-300 focus:ring-rose-100'
											: 'border-slate-200 focus:border-blue-300 focus:ring-blue-100'
									)}
									placeholder='Prueba 1'
								/>
								{fieldErrors.title && (
									<div className='mt-2 text-xs font-extrabold text-rose-700'>
										{fieldErrors.title}
									</div>
								)}
							</div>

							<div>
								<FieldLabel hint='Optional, but recommended.'>
									Product Description
								</FieldLabel>
								<textarea
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className='min-h-[140px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100'
									placeholder='Optional description...'
								/>
							</div>

							<div>
								<FieldLabel hint='Optional identifier (SKU/slug).'>
									Identifier
								</FieldLabel>
								<input
									value={identifier}
									onChange={(e) => setIdentifier(e.target.value)}
									className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100'
									placeholder='(optional)'
								/>
							</div>
						</div>
					</CardShell>

					<CardShell
						title='Pricing'
						subtitle='Only price is required. Discount is optional.'
						right={
							priceHint && !priceHint.includes('lower') ? (
								<div className='inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700'>
									<FiCheck />
									{priceHint}
								</div>
							) : null
						}
					>
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
							<div>
								<FieldLabel required>Price</FieldLabel>
								<div
									className={clsx(
										'flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 shadow-sm focus-within:ring-4',
										fieldErrors.price
											? 'border-rose-300 focus-within:border-rose-300 focus-within:ring-rose-100'
											: 'border-slate-200 focus-within:border-blue-300 focus-within:ring-blue-100'
									)}
								>
									<span className='text-sm font-extrabold text-slate-500'>
										$
									</span>
									<input
										value={price}
										onChange={(e) => {
											setPrice(e.target.value);
											if (fieldErrors.price)
												setFieldErrors((p) => ({ ...p, price: undefined }));
										}}
										className='w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400'
										placeholder='10'
										inputMode='decimal'
									/>
								</div>
								{fieldErrors.price && (
									<div className='mt-2 text-xs font-extrabold text-rose-700'>
										{fieldErrors.price}
									</div>
								)}
								<div className='mt-2 text-[11px] font-semibold text-slate-400'>
									Currency:{' '}
									<span className='font-extrabold text-slate-600'>
										{currency.toUpperCase()}
									</span>
								</div>
							</div>

							<div>
								<FieldLabel
									hint={
										priceHint && priceHint.includes('lower')
											? priceHint
											: undefined
									}
								>
									Discounted Price
								</FieldLabel>
								<div
									className={clsx(
										'flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 shadow-sm focus-within:ring-4',
										fieldErrors.discounted_price
											? 'border-rose-300 focus-within:border-rose-300 focus-within:ring-rose-100'
											: 'border-slate-200 focus-within:border-blue-300 focus-within:ring-blue-100'
									)}
								>
									<span className='text-sm font-extrabold text-slate-500'>
										$
									</span>
									<input
										value={discountedPrice}
										onChange={(e) => {
											setDiscountedPrice(e.target.value);
											if (fieldErrors.discounted_price)
												setFieldErrors((p) => ({
													...p,
													discounted_price: undefined,
												}));
										}}
										className='w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400'
										placeholder='(optional)'
										inputMode='decimal'
									/>
								</div>
								{fieldErrors.discounted_price && (
									<div className='mt-2 text-xs font-extrabold text-rose-700'>
										{fieldErrors.discounted_price}
									</div>
								)}
							</div>
						</div>
					</CardShell>

					<CardShell
						title='Categories'
						subtitle='Optional: assign one or more categories.'
						right={
							<span className='inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200'>
								<FiTag />
								{selectedCategoryIds.length}
							</span>
						}
					>
						{!mounted ? (
							<div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500'>
								Loading selector…
							</div>
						) : (
							<>
								<Select
									instanceId='product-categories-select'
									inputId='product-categories-select-input'
									isMulti
									isLoading={catsLoading}
									options={categoryOptions}
									value={selectedCategories}
									onChange={(value: MultiValue<CategoryOption>) =>
										setSelectedCategories(value as CategoryOption[])
									}
									placeholder='Search categories...'
									noOptionsMessage={() =>
										catsLoading ? 'Loading...' : 'No categories found'
									}
									classNamePrefix='enrollait-select'
									styles={selectStyles}
									components={{ IndicatorSeparator: () => null }}
								/>

								{catsError && (
									<div className='mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-extrabold text-rose-700'>
										{catsError}
									</div>
								)}
							</>
						)}
					</CardShell>

					<CardShell
						title='Associate Courses'
						subtitle='Optional: link Moodle courses for auto-enrollment.'
					>
						{!mounted ? (
							<div className='rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500'>
								Loading selector…
							</div>
						) : (
							<>
								<Select
									instanceId='moodle-courses-select'
									inputId='moodle-courses-select-input'
									isMulti
									isLoading={coursesLoading}
									options={courseOptions}
									value={selectedCourses}
									onChange={(value: MultiValue<CourseOption>) =>
										setSelectedCourses(value as CourseOption[])
									}
									placeholder='Search Moodle course ID or name...'
									noOptionsMessage={() =>
										coursesLoading ? 'Loading...' : 'No courses found'
									}
									classNamePrefix='enrollait-select'
									styles={selectStyles}
									components={{ IndicatorSeparator: () => null }}
								/>

								{coursesError && (
									<div className='mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-extrabold text-rose-700'>
										{coursesError}
									</div>
								)}

								<div className='mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-extrabold text-slate-700'>
									Linked courses:{' '}
									<span className='text-slate-900'>
										{selectedCourseIds.length}
									</span>
								</div>
							</>
						)}
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
								<div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white'>
									<img
										src={imagePreview}
										alt='Product preview'
										className='h-[220px] w-full object-cover'
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

					<CardShell
						title='Publishing'
						subtitle='UI toggle (send to backend if supported).'
					>
						<Toggle
							checked={published}
							onChange={setPublished}
							label='Is published'
						/>
						<div className='mt-3 text-[11px] font-semibold text-slate-400'>
							Note: your provided{' '}
							<span className='font-extrabold'>POST /products</span> curl
							doesn&apos;t include a{' '}
							<span className='font-extrabold'>published</span> field. If your
							backend supports it, add it to FormData.
						</div>
					</CardShell>
				</div>
			</div>
		</main>
	);
}
