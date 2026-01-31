import Link from 'next/link';

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
	return (
		<nav className='mb-4 text-xs text-slate-500' aria-label='Breadcrumb'>
			<ol className='flex flex-wrap items-center gap-2'>
				{items.map((c, i) => {
					const isLast = i === items.length - 1;
					return (
						<li key={`${c.label}-${i}`} className='flex items-center gap-2'>
							{c.href && !isLast ? (
								<Link href={c.href} className='hover:text-slate-700'>
									{c.label}
								</Link>
							) : (
								<span className={isLast ? 'font-medium text-slate-700' : ''}>
									{c.label}
								</span>
							)}
							{!isLast ? <span className='text-slate-300'>/</span> : null}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
