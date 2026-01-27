export interface ProductsPagedResponse {
	ok: boolean;
	page: number;
	page_size: number;
	total: number;
	total_pages: number;
	items: ProductItem[];
}

export interface ProductItem {
	id: number;
	tenant_id: number;
	moodle_course_id: number;

	slug: string;
	title: string;
	description: string;
	image_url: string;
	badge?: string;

	// Backend sends these as strings (e.g. "20.99")
	price: string;
	discounted_price: string | null;

	price_cents: number;
	currency: string; // could narrow to "usd" | "cop" etc later

	is_published: boolean;

	identifier: string | null;
	stock_status: 'available' | 'unavailable' | 'out_of_stock' | string;

	// It's a datetime string from backend
	created_at: string;

	categories?: Category[];
}

export interface Category {
	id: number;
	name: string;
	slug: string;
}

// use the same type your page returns (or make a shared type file)
export type ProductForStripeCheckout = {
	id: number;
	tenant_id: number;
	moodle_course_id: number;
	slug: string;
	title: string;
	description: string;
	image_url: string | null;
	price: string;
	discounted_price: string | null;
	price_cents: number;
	currency: string;
	is_published: boolean;
	identifier: string | null;
	stock_status: string;
	created_at: string;
	categories?: { id: number; name: string; slug: string }[];
};

export type MeResponse = {
	ok: boolean;
	tenant_id: number;
	admin_user_id: number;
	email: string;
	role: string;
};
