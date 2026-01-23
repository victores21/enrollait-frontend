export default function FieldError({ error }: { error?: string }) {
	if (!error) return null;
	return (
		<div className='mt-2 text-xs font-extrabold text-rose-700'>{error}</div>
	);
}
