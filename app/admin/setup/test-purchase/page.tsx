'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
	FiArrowLeft,
	FiArrowRight,
	FiInfo,
	FiRefreshCw,
	FiShoppingCart,
} from 'react-icons/fi';

import CardShell from '@/app/components/CardShell';
import LoadingOverlay from '@/app/components/LoadingOverlay';
import { Pill } from '@/app/components/Pill';
import WizardStepper from '@/app/components/WizardStepper';

/**
 * Mock-only layout for: /admin/setup/test-purchase
 * Put this file at: app/admin/setup/test-purchase/page.tsx
 */
export default function TestPurchaseWizardPage() {
	const step = 4;
	const total = 4;
	const pct = Math.round((step / total) * 100);

	const [creating, setCreating] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const orders = useMemo(
		() => [
			{
				id: 'ord_test_8392ka',
				email: 'jane.doe@example.com',
				product: 'Pro Plan (Monthly)',
				date: 'Just now',
				status: 'paid' as const,
			},
			{
				id: 'ord_test_1029xb',
				email: 'test_user@enrollait.com',
				product: 'Enterprise Seat',
				date: '2 mins ago',
				status: 'pending' as const,
			},
		],
		[],
	);

	function onCreateTestCheckout() {
		setCreating(true);
		setTimeout(() => setCreating(false), 900);
	}

	function onRefreshStatus() {
		setRefreshing(true);
		setTimeout(() => setRefreshing(false), 650);
	}

	function StatusCell({ status }: { status: 'paid' | 'pending' }) {
		if (status === 'paid') return <Pill variant='green'>Paid</Pill>;
		return <Pill variant='amber'>Pending</Pill>;
	}

	return (
		<main className='mx-auto max-w-[1200px] px-4 py-8 md:px-6'>
			<LoadingOverlay
				show={creating || refreshing}
				title={creating ? 'Creating checkout session…' : 'Refreshing status…'}
				message='Please wait a moment.'
			/>
			<WizardStepper step={step} total={total} rightText='TEST PURCHASE' />

			{/* Header */}
			<div className='mt-8'>
				<h1 className='text-5xl font-extrabold tracking-tight text-slate-900'>
					End-to-End Test Purchase
				</h1>
				<p className='mt-3 text-lg font-medium text-slate-500'>
					Verify your payment gateway is working correctly before going live.
				</p>
			</div>

			{/* Test Mode info card */}
			<div className='mt-8 rounded-3xl border border-blue-100 bg-blue-50/40 p-6 sm:p-7'>
				<div className='flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between'>
					<div className='min-w-0'>
						<div className='flex items-center gap-3'>
							<div className='grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white'>
								<FiInfo className='h-4 w-4' />
							</div>
							<div className='text-base font-extrabold text-blue-700'>
								Stripe Test Mode Active
							</div>
						</div>

						<p className='mt-3 max-w-[720px] text-sm font-semibold leading-6 text-slate-600'>
							You are currently in Stripe Test Mode. No real charges will be
							made. Use the test card number below to simulate a successful
							payment.
						</p>

						<div className='mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4'>
							<div className='inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-mono text-sm font-extrabold text-slate-700 shadow-sm'>
								4242 4242 4242 4242
							</div>
							<div className='text-sm font-semibold text-slate-500'>
								Any CVC, Any future date
							</div>
						</div>
					</div>

					{/* Placeholder card image */}
					<div className='h-28 w-full max-w-[220px] rounded-2xl bg-gradient-to-br from-rose-100 via-slate-100 to-emerald-100 shadow-sm sm:w-[220px]' />
				</div>
			</div>

			{/* Initiate test transaction card */}
			<div className='mt-6'>
				<CardShell
					title='Initiate Test Transaction'
					subtitle='Create a checkout session to test the end-to-end flow.'
					right={
						<button
							type='button'
							onClick={onCreateTestCheckout}
							className='inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700'
						>
							<FiShoppingCart className='h-4 w-4' />
							Create test checkout session
						</button>
					}
				>
					<div className='text-sm font-semibold text-slate-500'>
						This will open Stripe Checkout in test mode.
					</div>
				</CardShell>
			</div>

			{/* Recent Test Orders */}
			<div className='mt-8'>
				<div className='flex items-center justify-between'>
					<h2 className='text-2xl font-extrabold tracking-tight text-slate-900'>
						Recent Test Orders
					</h2>

					<button
						type='button'
						onClick={onRefreshStatus}
						className='inline-flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-slate-700'
					>
						<FiRefreshCw className='h-4 w-4' />
						Refresh Status
					</button>
				</div>

				<div className='mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
					<div className='grid grid-cols-12 bg-slate-50 px-5 py-4 text-sm font-extrabold text-slate-500'>
						<div className='col-span-3'>Order ID</div>
						<div className='col-span-3'>Email</div>
						<div className='col-span-3'>Product</div>
						<div className='col-span-2'>Date</div>
						<div className='col-span-1 text-right'>Status</div>
					</div>

					{orders.map((o, idx) => (
						<div
							key={o.id}
							className={`grid grid-cols-12 items-center px-5 py-4 text-sm ${
								idx !== orders.length - 1 ? 'border-b border-slate-200' : ''
							}`}
						>
							<div className='col-span-3 font-mono font-bold text-slate-700'>
								{o.id}
							</div>
							<div className='col-span-3 font-semibold text-slate-900'>
								{o.email}
							</div>
							<div className='col-span-3 font-semibold text-slate-600'>
								{o.product}
							</div>
							<div className='col-span-2 font-semibold text-slate-500'>
								{o.date}
							</div>
							<div className='col-span-1 flex justify-end'>
								<StatusCell status={o.status} />
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Bottom actions */}
			<div className='mt-10 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center'>
				<Link
					href='/admin/setup'
					className='inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 shadow-sm hover:bg-slate-50'
				>
					<FiArrowLeft className='h-4 w-4' />
					Back
				</Link>

				<button
					type='button'
					className='inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-blue-700'
				>
					Next Step <FiArrowRight className='h-4 w-4' />
				</button>
			</div>
		</main>
	);
}
