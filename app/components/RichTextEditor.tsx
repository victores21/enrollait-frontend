'use client';

import clsx from '@/lib/clsx';
import { useEffect, useMemo, useRef } from 'react';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExt from '@tiptap/extension-link';
import ImageExt from '@tiptap/extension-image';

import {
	FiBold,
	FiItalic,
	FiUnderline,
	FiList,
	FiCode,
	FiX,
} from 'react-icons/fi';
import { FiLink as FiLinkIcon, FiImage as FiImageIcon } from 'react-icons/fi';

type Props = {
	value: string;
	onChange: (html: string) => void;
	error?: string;
	maxChars?: number;
	className?: string;
	heightClassName?: string;
	stickyTopClassName?: string;
	fullPage?: boolean;
};

export default function RichTextEditor({
	value,
	onChange,
	error,
	maxChars = 50000,
	className,
	heightClassName = 'h-[calc(100vh-240px)]',
	stickyTopClassName = 'top-0',
	fullPage = false,
}: Props) {
	const isClient = typeof window !== 'undefined';

	// ✅ keep latest onChange without causing editor to re-init
	const onChangeRef = useRef(onChange);
	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	// ✅ guard against "echo" updates causing cursor jumps
	const lastEmittedRef = useRef<string>('');

	// ✅ optional: debounce updates (smooth typing + fewer re-renders)
	const rafRef = useRef<number | null>(null);

	const proseClass = useMemo(
		() =>
			clsx(
				'ProseMirror focus:outline-none w-full h-full min-h-[600px] px-4 py-4',
				'prose prose-sm max-w-none',

				// Lists
				'prose-ul:list-disc! prose-ol:list-decimal!',
				'prose-ul:pl-6! prose-ol:pl-6!',
				'prose-li:my-1',

				// Links
				'prose-a:text-primary prose-a:font-semibold prose-a:underline prose-a:underline-offset-4',

				// Inline code
				'prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:font-semibold prose-code:text-slate-900',
				'prose-code:before:content-none prose-code:after:content-none',

				// Code blocks
				'prose-pre:rounded-2xl prose-pre:bg-slate-950 prose-pre:text-slate-100 prose-pre:p-4 prose-pre:border prose-pre:border-slate-800',
				'prose-pre:overflow-x-auto prose-pre:leading-6',

				// Images
				'prose-img:rounded-xl prose-img:border prose-img:border-slate-200',
			),
		[],
	);

	const editor = useEditor(
		{
			immediatelyRender: false,
			editable: isClient,

			extensions: [
				StarterKit.configure({
					heading: { levels: [1, 2, 3, 4] },
				}),
				Underline,
				LinkExt.configure({
					openOnClick: false,
					autolink: true,
					linkOnPaste: true,
					HTMLAttributes: {
						rel: 'nofollow noopener noreferrer',
						target: '_blank',
					},
				}),
				ImageExt.configure({
					inline: false,
					allowBase64: false,
				}),
			],

			content: value || '<p></p>',

			editorProps: {
				attributes: {
					class: proseClass,
				},
			},

			onUpdate: ({ editor }) => {
				if (!isClient) return;

				const html = editor.getHTML();
				if (html.length > maxChars) return;

				lastEmittedRef.current = html;

				// ✅ debounce with rAF to avoid "state update every keystroke" jank
				if (rafRef.current) cancelAnimationFrame(rafRef.current);
				rafRef.current = requestAnimationFrame(() => {
					onChangeRef.current(html);
				});
			},
		},
		// important: do NOT include `onChange` here, we use onChangeRef
		[isClient, maxChars, proseClass],
	);

	// ✅ Sync external value -> editor content, but NEVER while typing (focused)
	useEffect(() => {
		if (!editor) return;

		const next = value || '<p></p>';

		// ignore echo-back from our own onUpdate
		if (lastEmittedRef.current === next) return;

		// ✅ critical: don't setContent while editor focused (prevents cursor jumping)
		if (editor.isFocused) return;

		const current = editor.getHTML();
		if (current !== next) editor.commands.setContent(next, false);
	}, [value, editor]);

	useEffect(() => {
		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
		};
	}, []);

	function setLink() {
		if (!editor) return;
		const prev = editor.getAttributes('link')?.href || '';
		const url = window.prompt('Enter URL', prev);
		if (url === null) return;

		const trimmed = url.trim();
		if (trimmed === '') {
			editor.chain().focus().extendMarkRange('link').unsetLink().run();
			return;
		}
		editor
			.chain()
			.focus()
			.extendMarkRange('link')
			.setLink({ href: trimmed })
			.run();
	}

	function addImageByUrl() {
		if (!editor) return;
		const url = window.prompt('Image URL (https://...)');
		if (!url) return;
		const trimmed = url.trim();
		if (!trimmed) return;
		editor.chain().focus().setImage({ src: trimmed }).run();
	}

	const btnBase =
		'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-extrabold shadow-sm whitespace-nowrap';
	const btnOn = 'border-slate-300 bg-slate-900 text-white';
	const btnOff = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

	if (!isClient || !editor) {
		return (
			<div className={clsx('space-y-2', className)}>
				<div className='h-10 w-full rounded-xl bg-slate-100' />
				<div className='min-h-[600px] rounded-2xl border border-slate-200 bg-white' />
				<div className='text-[11px] font-semibold text-slate-500'>
					Loading editor…
				</div>
			</div>
		);
	}

	return (
		<div
			className={clsx(
				'rounded-2xl border bg-white overflow-hidden flex flex-col',
				error ? 'border-rose-300' : 'border-slate-200',
				fullPage ? heightClassName : '',
				className,
			)}
		>
			{/* Sticky toolbar */}
			<div
				className={clsx(
					'sticky z-20 border-b border-slate-200 bg-white/90 backdrop-blur',
					stickyTopClassName,
				)}
			>
				<div className='flex flex-wrap items-center gap-2 p-3'>
					<button
						type='button'
						className={clsx(btnBase, editor.isActive('bold') ? btnOn : btnOff)}
						onClick={() => editor.chain().focus().toggleBold().run()}
					>
						<FiBold /> Bold
					</button>

					<button
						type='button'
						className={clsx(
							btnBase,
							editor.isActive('italic') ? btnOn : btnOff,
						)}
						onClick={() => editor.chain().focus().toggleItalic().run()}
					>
						<FiItalic /> Italic
					</button>

					<button
						type='button'
						className={clsx(
							btnBase,
							editor.isActive('underline') ? btnOn : btnOff,
						)}
						onClick={() => editor.chain().focus().toggleUnderline().run()}
					>
						<FiUnderline /> Underline
					</button>

					<button
						type='button'
						className={clsx(
							btnBase,
							editor.isActive('bulletList') ? btnOn : btnOff,
						)}
						onClick={() => editor.chain().focus().toggleBulletList().run()}
					>
						<FiList /> Bullets
					</button>

					<button
						type='button'
						className={clsx(
							btnBase,
							editor.isActive('codeBlock') ? btnOn : btnOff,
						)}
						onClick={() => editor.chain().focus().toggleCodeBlock().run()}
					>
						<FiCode /> Code
					</button>

					<button
						type='button'
						className={clsx(btnBase, editor.isActive('link') ? btnOn : btnOff)}
						onClick={setLink}
					>
						<FiLinkIcon /> Link
					</button>

					<button
						type='button'
						className={clsx(btnBase, btnOff)}
						onClick={addImageByUrl}
					>
						<FiImageIcon /> Image URL
					</button>

					<button
						type='button'
						className={clsx(btnBase, btnOff)}
						onClick={() =>
							editor.chain().focus().clearNodes().unsetAllMarks().run()
						}
					>
						<FiX /> Clear formatting
					</button>

					<div className='ml-auto hidden md:flex items-center gap-3'>
						<div className='text-[11px] font-semibold text-slate-500'>
							{(value || '').length}/{maxChars}
						</div>
					</div>
				</div>
			</div>

			{/* Scrollable content */}
			<div className='flex-1 overflow-auto'>
				<EditorContent editor={editor} />
			</div>

			{/* Footer */}
			<div className='border-t border-slate-200 bg-white px-3 py-2'>
				<div className='flex items-center justify-between gap-3'>
					<div className='text-[11px] font-semibold text-slate-500'>
						This saves HTML. Sanitize on backend.
					</div>
					<div className='text-[11px] font-semibold text-slate-500 md:hidden'>
						{(value || '').length}/{maxChars}
					</div>
				</div>

				{error ? (
					<div className='mt-2 text-xs font-extrabold text-rose-700'>
						{error}
					</div>
				) : null}
			</div>
		</div>
	);
}
