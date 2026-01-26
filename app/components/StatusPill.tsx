import { OrderStatus } from '../admin/orders/page';
import { Pill } from './Pill';

export function StatusPill({ status }: { status: OrderStatus }) {
	if (status === 'fulfilled') return <Pill variant='green'>Fulfilled</Pill>;
	if (status === 'paid') return <Pill variant='blue'>Paid</Pill>;
	if (status === 'pending') return <Pill variant='amber'>Pending</Pill>;
	if (status === 'expired') return <Pill variant='rose'>Expired</Pill>;
	return <Pill variant='slate'>Other</Pill>;
}
