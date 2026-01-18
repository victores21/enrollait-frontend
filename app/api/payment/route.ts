import Stripe from 'stripe';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function toCents(amountStr: string): number {
	const n = Number(amountStr);
	if (!Number.isFinite(n) || n <= 0) return 0;
	return Math.round(n * 100);
}

function getBaseUrl(req: Request) {
	// Prefer explicit env var (best for prod behind proxies)
	const envUrl =
		process.env.NEXT_PUBLIC_APP_URL ||
		process.env.APP_URL ||
		process.env.VERCEL_URL;

	if (envUrl) {
		// VERCEL_URL is usually host only (no protocol)
		if (envUrl.startsWith('http://') || envUrl.startsWith('https://'))
			return envUrl;
		return `https://${envUrl}`;
	}

	// Fallback: infer from request headers (works locally + most deployments)
	const proto = req.headers.get('x-forwarded-proto') ?? 'http';
	const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');

	if (!host) return 'http://localhost:3000'; // last-resort fallback
	return `${proto}://${host}`;
}

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const tenant_id = Number(body.tenant_id ?? 1);
		const product = body.product;
		const customer_email = body.customer_email ?? null;

		if (!product?.id || !product?.title) {
			return NextResponse.json(
				{ ok: false, message: 'Missing product data' },
				{ status: 400 }
			);
		}

		const unitAmount =
			product.discounted_price && product.discounted_price !== product.price
				? toCents(product.discounted_price)
				: product.price_cents ?? toCents(product.price);

		if (!unitAmount || unitAmount < 50) {
			return NextResponse.json(
				{ ok: false, message: 'Invalid price' },
				{ status: 400 }
			);
		}

		const currency = (product.currency ?? 'usd').toLowerCase();
		const meta = {
			tenant_id: String(tenant_id),
			product_id: String(product.id),
			product_slug: String(product.slug ?? ''),
		};

		const baseUrl = getBaseUrl(req);
		const return_url =
			body.return_url ?? `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;

		const session = await stripe.checkout.sessions.create({
			ui_mode: 'embedded',
			mode: 'payment',
			...(customer_email ? { customer_email } : {}),
			client_reference_id: `${tenant_id}:${product.id}`,

			line_items: [
				{
					quantity: 1,
					price_data: {
						unit_amount: unitAmount,
						currency,
						product_data: {
							name: product.title,
							description: product.description ?? undefined,
							images: product.image_url ? [product.image_url] : undefined,
						},
					},
				},
			],

			metadata: meta,
			payment_intent_data: { metadata: meta },

			return_url,
		});

		return NextResponse.json({
			ok: true,
			id: session.id,
			client_secret: session.client_secret,
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error(error);
		return NextResponse.json(
			{ ok: false, message: 'Failed to create checkout session' },
			{ status: 500 }
		);
	}
}
