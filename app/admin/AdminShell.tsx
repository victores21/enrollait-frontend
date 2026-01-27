'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
	FiBarChart2,
	FiBookOpen,
	FiShoppingCart,
	FiSettings,
	FiLink,
	FiSearch,
	FiChevronDown,
	FiX,
} from 'react-icons/fi';

type NavItem = {
	label: string;
	icon: React.ReactNode;
	active?: boolean;
	badgeDot?: boolean;
	url?: string;
};

function clsx(...parts: Array<string | false | null | undefined>) {
	return parts.filter(Boolean).join(' ');
}

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const pathname = usePathname();

	const platformNav: NavItem[] = useMemo(
		() => [
			{
				label: 'Dashboard',
				icon: <FiBarChart2 className='h-4 w-4' />,
				active: pathname === '/admin',
				url: '/admin',
			},
			{
				label: 'Products',
				icon: <FiBookOpen className='h-4 w-4' />,
				active:
					pathname === '/admin/products' ||
					pathname.startsWith('/admin/products/'),
				url: '/admin/products',
			},
			{
				label: 'Orders',
				icon: <FiShoppingCart className='h-4 w-4' />,
				active:
					pathname === '/admin/orders' || pathname.startsWith('/admin/orders/'),
				url: '/admin/orders',
			},
		],
		[pathname],
	);

	const configNav: NavItem[] = useMemo(
		() => [
			{
				label: 'Integrations',
				icon: <FiLink className='h-4 w-4' />,
				badgeDot: true,
				url: '/admin/integrations',
				active:
					pathname === '/admin/integrations' ||
					pathname.startsWith('/admin/integrations/'),
			},
		],
		[pathname],
	);

	return (
		<div className='min-h-screen bg-slate-50 text-slate-900'>
			{/* Mobile overlay */}
			{mobileOpen && (
				<div
					className='fixed inset-0 z-40 bg-black/30 md:hidden'
					onClick={() => setMobileOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={clsx(
					'fixed inset-y-0 left-0 z-50 w-[280px] lg:w-[240px] border-r border-slate-200 bg-white',
					'transition-transform lg:translate-x-0',
					mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
				)}
			>
				<div className='flex h-full flex-col'>
					{/* Brand */}
					<div className='flex items-center gap-3 px-6 py-5'>
						<div className='grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shadow-sm'>
							<svg viewBox='0 0 24 24' className='h-5 w-5' fill='none'>
								<path
									d='M3 8.5L12 4l9 4.5-9 4.5L3 8.5Z'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinejoin='round'
								/>
								<path
									d='M7 10.5V16c0 1.8 2.2 3 5 3s5-1.2 5-3v-5.5'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
								/>
							</svg>
						</div>

						<div className='leading-tight'>
							<div className='text-sm font-extrabold'>Enrollait</div>
							<div className='text-xs font-medium text-slate-500'>Admin</div>
						</div>

						<button
							onClick={() => setMobileOpen(false)}
							className='ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden'
							aria-label='Close sidebar'
						>
							<FiX />
						</button>
					</div>

					<div className='px-4 pb-4'>
						<div className='px-3 py-2 text-[11px] font-bold tracking-widest text-slate-400'>
							PLATFORM
						</div>

						<nav className='space-y-1'>
							{platformNav.map((item) => (
								<Link
									key={item.label}
									href={item.url ?? '#'}
									onClick={() => setMobileOpen(false)}
									className={clsx(
										'flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm font-semibold',
										item.active
											? 'bg-blue-50 text-blue-700'
											: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
									)}
								>
									<span
										className={clsx(
											'grid h-8 w-8 place-items-center rounded-lg',
											item.active ? 'bg-white shadow-sm' : 'bg-transparent',
										)}
									>
										{item.icon}
									</span>
									<span className='flex-1'>{item.label}</span>
								</Link>
							))}
						</nav>

						<div className='mt-4 px-3 py-2 text-[11px] font-bold tracking-widest text-slate-400'>
							CONFIGURATION
						</div>

						<nav className='space-y-1'>
							{configNav.map((item) => (
								<Link
									key={item.label}
									href={item.url ?? '#'}
									onClick={() => setMobileOpen(false)}
									className={clsx(
										'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold',
										item.active
											? 'bg-blue-50 text-blue-700'
											: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
									)}
								>
									<span
										className={clsx(
											'grid h-8 w-8 place-items-center rounded-lg',
											item.active ? 'bg-white shadow-sm' : 'bg-transparent',
										)}
									>
										{item.icon}
									</span>
									<span className='flex-1'>{item.label}</span>
									{item.badgeDot && (
										<span className='h-2 w-2 rounded-full bg-rose-500' />
									)}
								</Link>
							))}
						</nav>
					</div>

					{/* <div className='mt-auto border-t border-slate-200 px-6 py-4'>
                        <div className='flex items-center gap-3'>
                            <div className='h-9 w-9 overflow-hidden rounded-full bg-slate-200'>
                                <div className='grid h-full w-full place-items-center text-xs font-black text-slate-600'>
                                    TC
                                </div>
                            </div>
                            <div className='min-w-0'>
                                <div className='truncate text-sm font-bold'>Tom Cook</div>
                                <div className='truncate text-xs font-medium text-slate-500'>
                                    tom@example.com
                                </div>
                            </div>
                            <FiChevronDown className='ml-auto text-slate-400' />
                        </div>
                    </div> */}
				</div>
			</aside>

			{/* Main wrapper */}
			<div className='lg:pl-[240px]'>
				<header className='sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur'>
					<div className='mx-auto flex h-10 max-w-[1200px] items-center gap-3 px-4 md:px-6'>
						<button
							onClick={() => setMobileOpen(true)}
							className='inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden'
							aria-label='Open sidebar'
						>
							<svg viewBox='0 0 24 24' className='h-5 w-5' fill='none'>
								<path
									d='M4 7h16M4 12h16M4 17h16'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
								/>
							</svg>
						</button>
					</div>

					{/* mobile search */}
					<div className='px-4 pb-3 md:hidden'>
						<div className='flex w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-500 shadow-sm'>
							<FiSearch className='text-slate-400' />
							<input
								className='w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400'
								placeholder='Search orders, students, or courses...'
							/>
						</div>
					</div>
				</header>

				{children}
			</div>
		</div>
	);
}
