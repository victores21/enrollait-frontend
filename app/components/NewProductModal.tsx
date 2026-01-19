// 'use client';

// import { useEffect } from 'react';
// import { FiX, FiUploadCloud, FiChevronDown, FiSearch } from 'react-icons/fi';

// function clsx(...parts: Array<string | false | null | undefined>) {
// 	return parts.filter(Boolean).join(' ');
// }

// export default function NewProductModal({
// 	open,
// 	onClose,
// }: {
// 	open: boolean;
// 	onClose: () => void;
// }) {
// 	// ESC to close
// 	useEffect(() => {
// 		if (!open) return;

// 		function onKeyDown(e: KeyboardEvent) {
// 			if (e.key === 'Escape') onClose();
// 		}
// 		window.addEventListener('keydown', onKeyDown);
// 		return () => window.removeEventListener('keydown', onKeyDown);
// 	}, [open, onClose]);

// 	// lock body scroll
// 	useEffect(() => {
// 		if (!open) return;
// 		const prev = document.body.style.overflow;
// 		document.body.style.overflow = 'hidden';
// 		return () => {
// 			document.body.style.overflow = prev;
// 		};
// 	}, [open]);

// 	return (
// 		<div
// 			className={clsx(
// 				'fixed inset-0 z-[60]',
// 				open ? 'pointer-events-auto' : 'pointer-events-none'
// 			)}
// 			aria-hidden={!open}
// 		>
// 			{/* Backdrop */}
// 			<div
// 				onClick={onClose}
// 				className={clsx(
// 					'absolute inset-0 bg-black/30 transition-opacity',
// 					open ? 'opacity-100' : 'opacity-0'
// 				)}
// 			/>

// 			{/* Slide-over panel */}
// 			<div
// 				className={clsx(
// 					'absolute inset-y-0 right-0 w-full sm:w-[520px] bg-white shadow-2xl',
// 					'transition-transform duration-200 ease-out',
// 					open ? 'translate-x-0' : 'translate-x-full'
// 				)}
// 				role='dialog'
// 				aria-modal='true'
// 				aria-label='New Product'
// 			>
// 				<div className='flex h-full flex-col'>
// 					{/* Header */}
// 					<div className='flex items-center justify-between border-b border-slate-200 px-6 py-5'>
// 						<div className='text-sm font-extrabold text-slate-900'>
// 							New Product
// 						</div>

// 						<button
// 							onClick={onClose}
// 							className='inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50'
// 							aria-label='Close'
// 						>
// 							<FiX />
// 						</button>
// 					</div>

// 					{/* Body */}
// 					<div className='flex-1 overflow-y-auto px-6 py-6'>
// 						<div className='space-y-6'>
// 							{/* Product Title */}
// 							<div>
// 								<label className='text-xs font-extrabold text-slate-700'>
// 									Product Title
// 								</label>
// 								<div className='mt-2'>
// 									<input
// 										className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100'
// 										placeholder='Introduction to Data Science'
// 										defaultValue='Introduction to Data Science'
// 									/>
// 								</div>
// 							</div>

// 							{/* Description */}
// 							<div>
// 								<label className='text-xs font-extrabold text-slate-700'>
// 									Description
// 								</label>
// 								<div className='mt-2'>
// 									<textarea
// 										className='min-h-[110px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100'
// 										defaultValue='Learn the basics of Data Science, from Python libraries to statistical analysis...'
// 									/>
// 								</div>
// 								<div className='mt-2 text-[11px] font-semibold text-slate-400'>
// 									Rich text formatting enabled.
// 								</div>
// 							</div>

// 							{/* Thumbnail Upload */}
// 							<div>
// 								<label className='text-xs font-extrabold text-slate-700'>
// 									Product Thumbnail
// 								</label>

// 								<div className='mt-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4'>
// 									<div className='flex flex-col items-center justify-center rounded-xl px-4 py-8 text-center'>
// 										<div className='grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200'>
// 											<FiUploadCloud className='text-slate-500' />
// 										</div>
// 										<div className='mt-3 text-sm font-extrabold text-blue-600'>
// 											Click to upload{' '}
// 											<span className='text-slate-500 font-semibold'>
// 												or drag and drop
// 											</span>
// 										</div>
// 										<div className='mt-1 text-[11px] font-semibold text-slate-400'>
// 											PNG, JPG or WEBP (MAX 2MB)
// 										</div>
// 									</div>
// 								</div>
// 							</div>

// 							{/* Currency + Price */}
// 							<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
// 								<div>
// 									<label className='text-xs font-extrabold text-slate-700'>
// 										Currency
// 									</label>
// 									<button
// 										type='button'
// 										disabled
// 										className='disabled:bg-slate-100 disabled:text-slate-400 mt-2 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-900 shadow-sm hover:bg-slate-50'
// 									>
// 										<span>USD</span>
// 										{/* <FiChevronDown className='text-slate-400' /> */}
// 									</button>
// 								</div>

// 								<div>
// 									<label className='text-xs font-extrabold text-slate-700'>
// 										Price
// 									</label>
// 									<div className='mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100'>
// 										<span className='text-sm font-extrabold text-slate-500'>
// 											$
// 										</span>
// 										<input
// 											className='w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400'
// 											defaultValue='150.00'
// 											placeholder='0.00'
// 										/>
// 									</div>
// 								</div>
// 							</div>

// 							{/* Link Moodle Courses */}
// 							<div>
// 								<div className='flex items-center gap-2 text-xs font-extrabold text-slate-700'>
// 									<span className='grid h-6 w-6 place-items-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100'>
// 										{/* small icon dot */}
// 										<span className='h-2 w-2 rounded-full bg-amber-500' />
// 									</span>
// 									Link Moodle Courses
// 								</div>

// 								<div className='mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm'>
// 									<input
// 										className='w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400'
// 										placeholder='Search Moodle course ID or name...'
// 									/>
// 									<FiSearch className='text-slate-400' />
// 								</div>

// 								<div className='mt-3 flex flex-wrap gap-2'>
// 									<span className='inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-700'>
// 										Course 104 - Data Basics
// 										<button
// 											className='grid h-4 w-4 place-items-center rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200'
// 											aria-label='Remove course'
// 											type='button'
// 										>
// 											<FiX className='h-3 w-3' />
// 										</button>
// 									</span>
// 								</div>
// 							</div>
// 						</div>
// 					</div>

// 					{/* Footer */}
// 					<div className='border-t border-slate-200 px-6 py-4'>
// 						<div className='flex items-center justify-end gap-3'>
// 							<button
// 								onClick={onClose}
// 								className='rounded-xl px-4 py-2 text-sm font-extrabold text-slate-600 hover:text-slate-900'
// 								type='button'
// 							>
// 								Cancel
// 							</button>
// 							<button
// 								className='rounded-xl bg-blue-600 px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700'
// 								type='button'
// 							>
// 								Save Product
// 							</button>
// 						</div>
// 					</div>
// 				</div>
// 			</div>
// 		</div>
// 	);
// }

'use client';

import { useEffect, useState } from 'react';
import Select, { MultiValue } from 'react-select';
import { FiX, FiUploadCloud } from 'react-icons/fi';
import { api, qs } from '@/lib/api/api';

function clsx(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(' ');
}

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

export default function NewProductModal({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	// -----------------------------
	// Modal behavior
	// -----------------------------
	useEffect(() => {
		if (!open) return;

		function onKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose();
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open, onClose]);

	useEffect(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	}, [open]);

	// -----------------------------
	// Moodle Courses (react-select)
	// -----------------------------
	const [coursesLoading, setCoursesLoading] = useState(false);
	const [coursesError, setCoursesError] = useState<string | null>(null);
	const [courseOptions, setCourseOptions] = useState<CourseOption[]>([]);
	const [selectedCourses, setSelectedCourses] = useState<CourseOption[]>([]);

	useEffect(() => {
		if (!open) return;

		let cancelled = false;

		async function loadCourses() {
			setCoursesLoading(true);
			setCoursesError(null);

			try {
				// GET /integrations/moodle/courses?page=1&page_size=50&only_linked=false
				const res = await api<MoodleCoursesResponse>(
					`/integrations/moodle/courses` +
						qs({
							page: 1,
							page_size: 50,
							only_linked: false,
						}),
					{ cache: 'no-store' }
				);

				if (cancelled) return;

				const opts: CourseOption[] = (res.items ?? []).map((c) => {
					const name = c.fullname ?? c.name ?? c.shortname ?? `Course ${c.id}`;
					return {
						value: c.id,
						label: `${name} (${c?.moodle_course_id})`, // ✅ "Medicine (8)"
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
	}, [open]);

	// Example: IDs you would send to backend on save
	const selectedCourseIds = selectedCourses.map((c) => c.value);

	return (
		<div
			className={clsx(
				'fixed inset-0 z-[60]',
				open ? 'pointer-events-auto' : 'pointer-events-none'
			)}
			aria-hidden={!open}
		>
			{/* Backdrop */}
			<div
				onClick={onClose}
				className={clsx(
					'absolute inset-0 bg-black/30 transition-opacity',
					open ? 'opacity-100' : 'opacity-0'
				)}
			/>

			{/* Slide-over panel */}
			<div
				className={clsx(
					'absolute inset-y-0 right-0 w-full sm:w-[520px] bg-white shadow-2xl',
					'transition-transform duration-200 ease-out',
					open ? 'translate-x-0' : 'translate-x-full'
				)}
				role='dialog'
				aria-modal='true'
				aria-label='New Product'
			>
				<div className='flex h-full flex-col'>
					{/* Header */}
					<div className='flex items-center justify-between border-b border-slate-200 px-6 py-5'>
						<div className='text-sm font-extrabold text-slate-900'>
							New Product
						</div>

						<button
							onClick={onClose}
							className='inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50'
							aria-label='Close'
						>
							<FiX />
						</button>
					</div>

					{/* Body */}
					<div className='flex-1 overflow-y-auto px-6 py-6'>
						<div className='space-y-6'>
							{/* Product Title */}
							<div>
								<label className='text-xs font-extrabold text-slate-700'>
									Product Title
								</label>
								<div className='mt-2'>
									<input
										className='w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100'
										placeholder='Introduction to Data Science'
										defaultValue='Introduction to Data Science'
									/>
								</div>
							</div>

							{/* Description */}
							<div>
								<label className='text-xs font-extrabold text-slate-700'>
									Description
								</label>
								<div className='mt-2'>
									<textarea
										className='min-h-[110px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100'
										defaultValue='Learn the basics of Data Science, from Python libraries to statistical analysis...'
									/>
								</div>
								<div className='mt-2 text-[11px] font-semibold text-slate-400'>
									Rich text formatting enabled.
								</div>
							</div>

							{/* Thumbnail Upload */}
							<div>
								<label className='text-xs font-extrabold text-slate-700'>
									Product Thumbnail
								</label>

								<div className='mt-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4'>
									<div className='flex flex-col items-center justify-center rounded-xl px-4 py-8 text-center'>
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
									</div>
								</div>
							</div>

							{/* Currency + Price */}
							<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
								<div>
									<label className='text-xs font-extrabold text-slate-700'>
										Currency
									</label>
									<button
										type='button'
										disabled
										className='mt-2 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-extrabold text-slate-900 shadow-sm hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400'
									>
										<span>USD</span>
									</button>
								</div>

								<div>
									<label className='text-xs font-extrabold text-slate-700'>
										Price
									</label>
									<div className='mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100'>
										<span className='text-sm font-extrabold text-slate-500'>
											$
										</span>
										<input
											className='w-full bg-transparent text-sm font-extrabold text-slate-900 outline-none placeholder:text-slate-400'
											defaultValue='150.00'
											placeholder='0.00'
										/>
									</div>
								</div>
							</div>

							{/* Link Moodle Courses (react-select multi) */}
							<div>
								<div className='flex items-center gap-2 text-xs font-extrabold text-slate-700'>
									<span className='grid h-6 w-6 place-items-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100'>
										<span className='h-2 w-2 rounded-full bg-amber-500' />
									</span>
									Link Moodle Courses
								</div>

								<div className='mt-3'>
									<Select
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
										styles={{
											control: (base, state) => ({
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
											valueContainer: (base) => ({
												...base,
												padding: '2px 6px',
											}),
											input: (base) => ({
												...base,
												margin: 0,
												padding: 0,
												fontWeight: 600,
												color: '#0f172a',
											}),
											placeholder: (base) => ({
												...base,
												fontWeight: 600,
												color: '#94a3b8',
											}),
											multiValue: (base) => ({
												...base,
												borderRadius: 9999,
												backgroundColor: 'rgb(255 251 235)',
												border: '1px solid rgb(253 230 138)',
											}),
											multiValueLabel: (base) => ({
												...base,
												fontWeight: 800,
												fontSize: 11,
												color: 'rgb(180 83 9)',
												padding: '3px 8px',
											}),
											multiValueRemove: (base) => ({
												...base,
												borderRadius: 9999,
												marginRight: 4,
												color: 'rgb(180 83 9)',
												':hover': {
													backgroundColor: 'rgb(254 243 199)',
													color: 'rgb(180 83 9)',
												},
											}),
											menu: (base) => ({
												...base,
												borderRadius: 16,
												overflow: 'hidden',
												border: '1px solid #e2e8f0',
												boxShadow:
													'0 12px 30px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06)',
											}),
											option: (base, state) => ({
												...base,
												fontSize: 13,
												fontWeight: 700,
												color: '#0f172a',
												backgroundColor: state.isFocused
													? 'rgb(248 250 252)'
													: '#fff',
												':active': { backgroundColor: 'rgb(239 246 255)' },
											}),
										}}
										components={{
											IndicatorSeparator: () => null,
										}}
									/>

									{coursesError && (
										<div className='mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-extrabold text-rose-700'>
											{coursesError}
										</div>
									)}

									{/* optional helper (remove if you don't want it) */}
									<div className='mt-2 text-[11px] font-semibold text-slate-400'>
										Selected IDs:{' '}
										{selectedCourseIds.length
											? selectedCourseIds.join(', ')
											: '—'}
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className='border-t border-slate-200 px-6 py-4'>
						<div className='flex items-center justify-end gap-3'>
							<button
								onClick={onClose}
								className='rounded-xl px-4 py-2 text-sm font-extrabold text-slate-600 hover:text-slate-900'
								type='button'
							>
								Cancel
							</button>
							<button
								className='rounded-xl bg-blue-600 px-4 py-2 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700'
								type='button'
							>
								Save Product
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
