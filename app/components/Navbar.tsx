'use client';

import { FiSearch, FiShoppingCart } from 'react-icons/fi';

export default function Navbar() {
	return (
		<div className='mx-auto bg-white shadow-xs px-4 py-4 sm:px-6 sm:py-4'>
			<div className='mx-auto max-w-[1300px] w-full'>
				<div className='flex flex-col gap-3 md:flex-row md:items-center md:gap-4'>
					{/* Left: Brand + Actions (top row on mobile) */}
					<div className='flex items-center justify-between gap-4 md:justify-start'>
						<div className='flex items-center gap-2 font-extrabold text-lg'>
							<div className='grid h-8 w-8 place-items-center rounded-md bg-[var(--primary)] text-white'>
								I
							</div>
							<span>Enrollait</span>
						</div>

						<div className='flex items-center gap-3 text-sm text-gray-700 md:hidden'>
							<button className='bg-white border border-[var(--primary)] px-4 py-2 rounded-lg text-[var(--primary)] font-semibold hover:bg-[var(--primary)] hover:text-white transition-colors'>
								Account
							</button>

							<button className='cursor-pointer' aria-label='Cart'>
								<FiShoppingCart className='text-xl' />
							</button>
						</div>
					</div>

					{/* Middle: Search (full width on mobile) */}
					<div className='flex w-full md:flex-1 md:justify-center md:min-w-0'>
						<div className='flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-black/5 w-full md:max-w-[420px] md:min-w-0'>
							<FiSearch className='text-gray-400 shrink-0' />
							<input
								className='w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-gray-400'
								placeholder='Search for anything...'
							/>
						</div>
					</div>

					{/* Right: Actions (desktop) */}
					<div className='ml-auto hidden md:flex items-center gap-5 text-sm text-gray-700'>
						<button className='bg-white border border-[var(--primary)] px-4 py-2 rounded-lg text-[var(--primary)] font-semibold hover:bg-[var(--primary)] hover:text-white transition-colors'>
							Account
						</button>

						<button className='cursor-pointer' aria-label='Cart'>
							<FiShoppingCart className='text-xl' />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
