import { FiChevronDown, FiPlay, FiLock } from 'react-icons/fi';
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from './Accordion';

export function CourseContentAccordion({
	course,
}: {
	course: {
		modules: Array<{
			title: string;
			meta: string;
			items: Array<{ title: string; time: string; locked?: boolean }>;
		}>;
	};
}) {
	// Default open: module that includes "Module 2"
	const defaultOpen =
		course.modules.find((m) => m.title.includes('Module 2'))?.title ?? null;

	return (
		<div className='mt-8'>
			<h2 className='text-sm font-semibold text-slate-900'>Course content</h2>

			<div className='mt-3 space-y-3'>
				<Accordion type='single' defaultValue={defaultOpen}>
					{course.modules.map((m) => (
						<AccordionItem
							key={m.title}
							value={m.title}
							className='rounded-xl border border-slate-200 bg-white shadow-sm mb-3'
						>
							<AccordionTrigger
								value={m.title}
								className='flex w-full items-center justify-between gap-3 px-4 py-3 cursor-pointer'
								rightIcon={
									<FiChevronDown
										className={[
											'h-4 w-4 text-slate-400 transition-transform',
											// rotate when open
											defaultOpen === m.title ? '' : '',
										].join(' ')}
									/>
								}
							>
								<div className='min-w-0 text-left'>
									<p className='truncate text-sm font-semibold text-slate-900'>
										{m.title}
									</p>
									<p className='mt-0.5 text-xs text-slate-500'>{m.meta}</p>
								</div>

								{/* rotate icon based on open state using group */}
								<span className='ml-auto'>
									<FiChevronDown className='h-4 w-4 text-slate-400 transition-transform data-[open=true]:rotate-180' />
								</span>
							</AccordionTrigger>

							{/* Content */}
							<AccordionContent
								value={m.title}
								className='border-t border-slate-200'
							>
								<div className='px-4 py-3'>
									<ul className='space-y-2'>
										{m.items.map((it) => (
											<li
												key={it.title}
												className='flex items-center justify-between gap-4 rounded-lg px-2 py-2 hover:bg-slate-50'
											>
												<div className='flex min-w-0 items-center gap-2'>
													<FiPlay className='h-4 w-4 shrink-0 text-slate-400' />
													<span className='truncate text-sm text-slate-700'>
														{it.title}
													</span>

													{it.locked ? (
														<span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200'>
															<FiLock className='h-3 w-3' />
															Preview Locked
														</span>
													) : null}
												</div>

												<span className='shrink-0 text-xs text-slate-500'>
													{it.time}
												</span>
											</li>
										))}
									</ul>
								</div>
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</div>
	);
}
