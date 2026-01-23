export default function FieldLabel({
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
			<div className='flex items-center gap-2 text-xs font-bold text-slate-700'>
				<span>{children}</span>
				{required && (
					<span className='rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700'>
						Required
					</span>
				)}
			</div>
			{hint && (
				<div className='mt-1 text-[11px] font-normal text-slate-500'>
					{hint}
				</div>
			)}
		</div>
	);
}
