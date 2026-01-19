'use client';

import { useMemo, useState } from 'react';

type Endpoint =
	| {
			id: string;
			type: 'api';
			name: string;
			description?: string;
			method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
			path: string; // relative to backend base URL

			// ✅ NEW: support JSON vs multipart endpoints
			bodyType?: 'json' | 'multipart';

			// used when bodyType === 'json'
			defaultBody?: unknown;

			// used when bodyType === 'multipart'
			defaultForm?: Record<string, unknown>;
			fileField?: string; // e.g. "image"
	  }
	| {
			id: string;
			type: 'link';
			name: string;
			description?: string;
			href: string; // absolute URL (docs, etc.)
	  };

function prettyJson(value: unknown) {
	return JSON.stringify(value, null, 2);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryParseJson(text: string): { ok: boolean; value: any } {
	try {
		return { ok: true, value: JSON.parse(text) };
	} catch {
		return { ok: false, value: text };
	}
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default function ApiTesterClient() {
	// ✅ Add endpoints here (you can add many)
	const endpoints: Endpoint[] = useMemo(
		() => [
			{
				id: 'moodle-test',
				type: 'api',
				name: 'Moodle Connection Test',
				description: 'Tests Moodle token + URL connectivity',
				method: 'POST',
				path: '/integrations/moodle/test',
				bodyType: 'json',
				defaultBody: {
					moodle_url: 'https://enrollait-test.moodlecloud.com/',
					token: '702f0346160b164c85327a65a1d8910b',
				},
			},
			{
				id: 'moodle-sync-courses',
				type: 'api',
				name: 'Moodle Sync Courses',
				description: 'Triggers Moodle course sync',
				method: 'POST',
				path: '/integrations/moodle/sync-courses',
				bodyType: 'json',
				defaultBody: {},
			},
			{
				id: 'moodle-sync-categories',
				type: 'api',
				name: 'Moodle Sync Categories',
				description: 'Triggers Moodle category sync',
				method: 'POST',
				path: '/integrations/moodle/sync-categories',
				bodyType: 'json',
				defaultBody: {},
			},

			// JSON create (your existing one)
			// {
			// 	id: 'products-create',
			// 	type: 'api',
			// 	name: 'Create Product (JSON)',
			// 	description: 'Creates a product in the catalog (JSON version)',
			// 	method: 'POST',
			// 	path: '/products',
			// 	bodyType: 'json',
			// 	defaultBody: {
			// 		slug: 'string',
			// 		title: 'string',
			// 		description: 'string',
			// 		image_url: 'string',
			// 		price: 0,
			// 		discounted_price: 0,
			// 		currency: 'usd',
			// 		is_published: false,
			// 		identifier: 'string',
			// 		stock_status: 'available',
			// 		moodle_course_id: 0,
			// 		category_ids: [0],
			// 	},
			// },

			// ✅ NEW: multipart create (matches your curl with -F and image upload)
			// {
			// 	id: 'products-create-multipart',
			// 	type: 'api',
			// 	name: 'Create Product (Multipart)',
			// 	description:
			// 		'Creates a product using multipart/form-data + image upload',
			// 	method: 'POST',
			// 	path: '/products',
			// 	bodyType: 'multipart',
			// 	fileField: 'image',
			// 	defaultForm: {
			// 		identifier: 'string',
			// 		price: 'producto 3',
			// 		discounted_price: 'string',
			// 		slug: 'string',
			// 		moodle_course_id: 0,
			// 		currency: 'usd',
			// 		category_ids: 'string',
			// 		title: 'producto 2',
			// 		is_published: false,
			// 		stock_status: 'available',
			// 		description: 'producto 2 des',
			// 	},
			// },
			{
				id: 'products-create-json-course-ids',
				type: 'api',
				name: 'Create Product (JSON - course_ids)',
				description:
					'Creates a product using JSON body with course_ids + category_ids',
				method: 'POST',
				path: '/products',
				bodyType: 'json',
				defaultBody: {
					title: 'string',
					description: 'string',
					image_url: 'string',
					price: 0,
					discounted_price: 0,
					currency: 'usd',
					identifier: 'string',
					stock_status: 'available',
					course_ids: [0],
					category_ids: [0],
				},
			},
			{
				id: 'products-create-multipart-course-ids',
				type: 'api',
				name: 'Create Product (Multipart - course_ids)',
				description:
					'Creates a product using multipart/form-data (supports image upload) with course_ids + category_ids',
				method: 'POST',
				path: '/products',
				bodyType: 'multipart',
				fileField: 'image',
				defaultForm: {
					identifier: '',
					price: '',
					discounted_price: '',
					currency: 'usd',
					course_ids: '',
					category_ids: '',
					title: '',
					stock_status: 'available',
					description: '',
				},
			},

			{
				id: 'products-paged',
				type: 'api',
				name: 'List Products (Paged)',
				description:
					'Gets paged products (published only) including categories',
				method: 'GET',
				path: '/products/paged?page=1&page_size=12&published_only=true&include_categories=true',
			},
			{
				id: 'moodle-courses-list',
				type: 'api',
				name: 'List Moodle Courses (Synced)',
				description:
					'Lists courses from local courses table (synced from Moodle). Supports q + only_linked.',
				method: 'GET',
				path: '/integrations/moodle/courses?page=1&page_size=50&q=&only_linked=false',
			},
		],
		[]
	);

	const [selectedId, setSelectedId] = useState(endpoints[0]?.id ?? '');
	const selected = endpoints.find((e) => e.id === selectedId);

	/**
	 * ✅ FIX: Remove server/client branch. NEXT_PUBLIC_* is safe in a Client Component
	 * and will be identical for the server pre-render and client hydration.
	 */
	const backendBase =
		process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

	// ✅ NEW: file state for multipart endpoints
	const [uploadFile, setUploadFile] = useState<File | null>(null);

	const [bodyText, setBodyText] = useState(() => {
		const first = endpoints[0];
		if (first && first.type === 'api') {
			if (first.bodyType === 'multipart') {
				return prettyJson(first.defaultForm ?? {});
			}
			if (first.defaultBody !== undefined) return prettyJson(first.defaultBody);
		}
		return '{\n  \n}';
	});

	const [headersText, setHeadersText] = useState(() =>
		prettyJson({
			accept: 'application/json',
			'Content-Type': 'application/json',
		})
	);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<number | null>(null);
	const [elapsedMs, setElapsedMs] = useState<number | null>(null);
	const [responseText, setResponseText] = useState<string>('');
	const [responseHeaders, setResponseHeaders] = useState<
		Record<string, string>
	>({});

	function onSelect(id: string) {
		setSelectedId(id);
		setError(null);
		setStatus(null);
		setElapsedMs(null);
		setResponseText('');
		setResponseHeaders({});
		setUploadFile(null);

		const next = endpoints.find((e) => e.id === id);
		if (next?.type === 'api') {
			// ✅ set body text based on endpoint type
			if (next.bodyType === 'multipart') {
				setBodyText(prettyJson(next.defaultForm ?? {}));

				// ✅ IMPORTANT: do NOT set Content-Type manually for multipart (boundary!)
				setHeadersText(
					prettyJson({
						accept: 'application/json',
					})
				);
			} else {
				const nextBody =
					next.defaultBody !== undefined
						? prettyJson(next.defaultBody)
						: '{\n  \n}';
				setBodyText(nextBody);

				setHeadersText(
					prettyJson({
						accept: 'application/json',
						'Content-Type': 'application/json',
					})
				);
			}
		}
	}

	async function send() {
		if (!selected || selected.type !== 'api') return;

		setLoading(true);
		setError(null);
		setStatus(null);
		setElapsedMs(null);
		setResponseText('');
		setResponseHeaders({});

		// Parse headers JSON
		const headersParsed = tryParseJson(headersText);
		if (!headersParsed.ok || !isPlainObject(headersParsed.value)) {
			setLoading(false);
			setError(
				'Headers must be a valid JSON object, e.g. { "accept": "application/json" }'
			);
			return;
		}

		const headersObj = headersParsed.value as Record<string, string>;

		// Build body
		let body: BodyInit | undefined = undefined;

		if (selected.method !== 'GET' && selected.method !== 'DELETE') {
			if (selected.bodyType === 'multipart') {
				const parsed = tryParseJson(bodyText);
				if (!parsed.ok || !isPlainObject(parsed.value)) {
					setLoading(false);
					setError('Body must be a valid JSON object for multipart fields.');
					return;
				}

				const fd = new FormData();
				const formObj = parsed.value as Record<string, unknown>;

				for (const [k, v] of Object.entries(formObj)) {
					if (v === undefined || v === null) continue;

					// If you want arrays here, you can change to append multiple times.
					fd.append(k, typeof v === 'string' ? v : String(v));
				}

				const fileKey = selected.fileField || 'image';
				if (uploadFile) {
					fd.append(fileKey, uploadFile);
				}

				body = fd;

				// ✅ Ensure we don't force a JSON content-type for multipart
				// (fetch sets correct multipart boundary)
				if ('Content-Type' in headersObj) delete headersObj['Content-Type'];
				if ('content-type' in headersObj) delete headersObj['content-type'];
			} else {
				const parsed = tryParseJson(bodyText);
				if (!parsed.ok) {
					setLoading(false);
					setError('Body must be valid JSON.');
					return;
				}
				body = JSON.stringify(parsed.value);
			}
		}

		const url = `${backendBase}${selected.path}`;
		const started = performance.now();

		try {
			const res = await fetch(url, {
				method: selected.method,
				headers: headersObj,
				body,
			});

			const ended = performance.now();
			setElapsedMs(Math.round(ended - started));
			setStatus(res.status);

			// Collect response headers (small, helpful for debugging)
			const rh: Record<string, string> = {};
			res.headers.forEach((v, k) => (rh[k] = v));
			setResponseHeaders(rh);

			const text = await res.text();
			const parsed = tryParseJson(text);

			setResponseText(
				parsed.ok ? prettyJson(parsed.value) : String(parsed.value)
			);

			if (!res.ok) {
				// keep response visible, but mark error
				setError(`Request failed (${res.status})`);
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			setError(e?.message || 'Request failed');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className='grid gap-6 lg:grid-cols-[280px_1fr] mt-4'>
			{/* Sidebar */}
			<aside className='rounded-2xl border border-gray-200 bg-white p-4 shadow-sm'>
				<div className='flex items-center justify-between'>
					<h2 className='text-sm font-semibold text-gray-900'>Endpoints</h2>
					<span className='text-xs text-gray-500'>API Tester</span>
				</div>

				<div className='mt-3 space-y-2'>
					{endpoints.map((e) => (
						<button
							key={e.id}
							onClick={() => onSelect(e.id)}
							className={[
								'w-full rounded-xl border px-3 py-2 text-left transition',
								e.id === selectedId
									? 'border-gray-900 bg-gray-900 text-white'
									: 'border-gray-200 bg-white hover:bg-gray-50',
							].join(' ')}
						>
							<div className='flex items-center justify-between gap-3'>
								<div className='min-w-0'>
									<div className='truncate text-sm font-semibold'>{e.name}</div>
									{e.description ? (
										<div
											className={[
												'truncate text-xs',
												e.id === selectedId ? 'text-white/80' : 'text-gray-500',
											].join(' ')}
										>
											{e.description}
										</div>
									) : null}
								</div>

								{e.type === 'api' ? (
									<span
										className={[
											'rounded-lg px-2 py-1 text-[11px] font-semibold',
											e.id === selectedId
												? 'bg-white/15 text-white'
												: 'bg-gray-100 text-gray-700',
										].join(' ')}
									>
										{e.method}
									</span>
								) : (
									<span
										className={[
											'rounded-lg px-2 py-1 text-[11px] font-semibold',
											e.id === selectedId
												? 'bg-white/15 text-white'
												: 'bg-gray-100 text-gray-700',
										].join(' ')}
									>
										LINK
									</span>
								)}
							</div>
						</button>
					))}
				</div>

				<div className='mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3'>
					<div className='text-xs font-semibold text-gray-700'>
						Backend Base URL
					</div>
					<div className='mt-1 break-all text-xs text-gray-600'>
						{backendBase}
					</div>
					<div className='mt-2 text-[11px] text-gray-500'>
						Set <span className='font-mono'>NEXT_PUBLIC_BACKEND_URL</span> in{' '}
						<span className='font-mono'>.env.local</span>.
					</div>
				</div>
			</aside>

			{/* Main */}
			<section className='rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'>
				<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
					<div>
						<h1 className='text-lg font-extrabold tracking-tight text-gray-900'>
							API Tester
						</h1>
						<div className='text-sm text-gray-500'>
							{selected?.type === 'api'
								? `${selected.method} ${selected.path}`
								: selected?.type === 'link'
								? 'Open docs link'
								: ''}
						</div>
					</div>

					{selected?.type === 'link' ? (
						<a
							href={selected.href}
							target='_blank'
							rel='noreferrer'
							className='inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800'
						>
							Open
						</a>
					) : (
						<button
							onClick={send}
							disabled={loading || !selected}
							className='inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60'
						>
							{loading ? 'Sending…' : 'Send request'}
						</button>
					)}
				</div>

				{selected?.type === 'api' ? (
					<>
						{/* ✅ Multipart file uploader */}
						{selected.bodyType === 'multipart' ? (
							<div className='mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3'>
								<div className='text-xs font-semibold text-gray-700'>
									File Upload
								</div>
								<div className='mt-1 text-[11px] text-gray-500'>
									Field:{' '}
									<span className='font-mono'>
										{selected.fileField || 'image'}
									</span>
								</div>

								<input
									type='file'
									accept='image/*'
									onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
									className='mt-3 block w-full text-xs'
								/>

								<div className='mt-2 text-[11px] text-gray-600'>
									{uploadFile ? (
										<>
											Selected:{' '}
											<span className='font-mono'>{uploadFile.name}</span>
										</>
									) : (
										<span className='text-gray-500'>No file selected.</span>
									)}
								</div>

								<div className='mt-2 text-[11px] text-gray-500'>
									Note: Don&apos;t set{' '}
									<span className='font-mono'>Content-Type</span> manually for
									multipart; the browser sets the boundary.
								</div>
							</div>
						) : null}

						<div className='mt-5 grid gap-4 lg:grid-cols-2'>
							<div>
								<label className='text-xs font-semibold text-gray-700'>
									Headers (JSON)
								</label>
								<textarea
									value={headersText}
									onChange={(e) => setHeadersText(e.target.value)}
									className='mt-2 h-40 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs outline-none focus:border-gray-900'
									spellCheck={false}
								/>
							</div>

							<div>
								<label className='text-xs font-semibold text-gray-700'>
									{selected.bodyType === 'multipart'
										? 'Form Fields (JSON)'
										: 'Body (JSON)'}
									<span className='ml-2 text-[11px] font-normal text-gray-500'>
										(for {selected.method})
									</span>
								</label>
								<textarea
									value={bodyText}
									onChange={(e) => setBodyText(e.target.value)}
									className='mt-2 h-40 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs outline-none focus:border-gray-900'
									spellCheck={false}
								/>
							</div>
						</div>

						<div className='mt-5 rounded-xl border border-gray-200 bg-gray-50 p-3'>
							<div className='text-xs font-semibold text-gray-700'>
								Request Preview
							</div>
							<div className='mt-2 font-mono text-xs text-gray-700'>
								<div>
									<span className='font-semibold'>{selected.method}</span>{' '}
									<span className='text-gray-600'>{backendBase}</span>
									<span className='text-gray-900'>{selected.path}</span>
								</div>
							</div>
						</div>

						{/* Result */}
						<div className='mt-5'>
							<div className='flex flex-wrap items-center gap-3'>
								<div className='text-xs font-semibold text-gray-700'>
									Response
								</div>
								{status !== null ? (
									<span
										className={[
											'rounded-lg px-2 py-1 text-[11px] font-semibold',
											status >= 200 && status < 300
												? 'bg-emerald-100 text-emerald-700'
												: 'bg-rose-100 text-rose-700',
										].join(' ')}
									>
										Status: {status}
									</span>
								) : null}
								{elapsedMs !== null ? (
									<span className='rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700'>
										Time: {elapsedMs}ms
									</span>
								) : null}
								{error ? (
									<span className='rounded-lg bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-700'>
										{error}
									</span>
								) : null}
							</div>

							<div className='mt-3 grid gap-4 lg:grid-cols-2'>
								<div>
									<div className='text-xs font-semibold text-gray-700'>
										Response Headers
									</div>
									<pre className='mt-2 max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white p-3 font-mono text-xs text-gray-700'>
										{prettyJson(responseHeaders)}
									</pre>
								</div>

								<div>
									<div className='text-xs font-semibold text-gray-700'>
										Response Body
									</div>
									<pre className='mt-2 max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white p-3 font-mono text-xs text-gray-700'>
										{responseText || '// Send a request to see output'}
									</pre>
								</div>
							</div>
						</div>
					</>
				) : (
					<div className='mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700'>
						This item is a link. Click{' '}
						<span className='font-semibold'>Open</span> to view it.
					</div>
				)}
			</section>
		</div>
	);
}
