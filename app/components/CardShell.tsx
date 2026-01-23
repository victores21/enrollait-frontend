export default function CardShell({
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
					<div className='text-sm font-bold text-slate-900'>{title}</div>
					{subtitle && (
						<div className='mt-1 text-[11px] font-normal text-slate-500'>
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
