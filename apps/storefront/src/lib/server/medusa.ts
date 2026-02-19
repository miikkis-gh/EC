import { env } from '$env/dynamic/private';

const BACKEND_URL = env.MEDUSA_BACKEND_URL || 'http://localhost:9000';

// --- Types ---

export interface Product {
	id: string;
	title: string;
	handle: string;
	description: string | null;
	thumbnail: string | null;
	images: { id: string; url: string }[];
	variants: ProductVariant[];
	options: ProductOption[];
	collection_id: string | null;
	collection: Collection | null;
	created_at: string;
	updated_at: string;
}

export interface ProductVariant {
	id: string;
	title: string;
	sku: string | null;
	prices: Price[];
	options: { id: string; value: string; option_id: string }[];
	inventory_quantity: number;
	manage_inventory: boolean;
	calculated_price?: {
		calculated_amount: number;
		currency_code: string;
	};
}

export interface ProductOption {
	id: string;
	title: string;
	values: { id: string; value: string }[];
}

export interface Price {
	id: string;
	amount: number;
	currency_code: string;
}

export interface Collection {
	id: string;
	title: string;
	handle: string;
	metadata: Record<string, unknown> | null;
}

export interface Cart {
	id: string;
	email: string | null;
	items: LineItem[];
	region_id: string;
	currency_code: string;
	total: number;
	subtotal: number;
	tax_total: number;
	shipping_total: number;
	discount_total: number;
	item_total: number;
	shipping_address: {
		first_name: string;
		last_name: string;
		address_1: string;
		city: string;
		country_code: string;
		postal_code: string;
		phone: string | null;
	} | null;
	payment_collection: PaymentCollection | null;
	shipping_methods: { shipping_option_id: string }[];
}

export interface LineItem {
	id: string;
	title: string;
	description: string | null;
	thumbnail: string | null;
	quantity: number;
	unit_price: number;
	total: number;
	variant_id: string;
	product_id: string;
	variant: ProductVariant;
}

export interface Customer {
	id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	phone: string | null;
	created_at: string;
}

export interface PaginatedResponse<T> {
	count: number;
	offset: number;
	limit: number;
	[key: string]: T[] | number;
}

// --- Generic Fetcher ---

interface MedusaError {
	message: string;
	type: string;
}

export async function medusaRequest<T>(
	path: string,
	options: RequestInit = {},
	cartId?: string
): Promise<T> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'x-publishable-api-key': env.MEDUSA_PUBLISHABLE_KEY || '',
		...(options.headers as Record<string, string>)
	};

	if (cartId) {
		headers['x-cart-id'] = cartId;
	}

	const response = await fetch(`${BACKEND_URL}/store${path}`, {
		...options,
		headers
	});

	if (!response.ok) {
		const error: MedusaError = await response.json().catch(() => ({
			message: `Request failed with status ${response.status}`,
			type: 'unknown_error'
		}));
		throw new Error(error.message);
	}

	return response.json();
}

// --- Products ---

export async function getProducts(params?: {
	limit?: number;
	offset?: number;
	collection_id?: string[];
	order?: string;
}): Promise<{ products: Product[]; count: number; offset: number; limit: number }> {
	const searchParams = new URLSearchParams();
	if (params?.limit) searchParams.set('limit', String(params.limit));
	if (params?.offset) searchParams.set('offset', String(params.offset));
	if (params?.order) searchParams.set('order', params.order);
	if (params?.collection_id) {
		params.collection_id.forEach((id) => searchParams.append('collection_id[]', id));
	}
	searchParams.set('fields', '+variants.calculated_price');

	const query = searchParams.toString();
	return medusaRequest<{ products: Product[]; count: number; offset: number; limit: number }>(
		`/products${query ? `?${query}` : ''}`
	);
}

export async function getProductByHandle(
	handle: string
): Promise<{ products: Product[] }> {
	return medusaRequest<{ products: Product[] }>(
		`/products?handle=${encodeURIComponent(handle)}&fields=+variants.calculated_price`
	);
}

// --- Collections ---

export async function getCollections(params?: {
	limit?: number;
	offset?: number;
}): Promise<{ collections: Collection[]; count: number; offset: number; limit: number }> {
	const searchParams = new URLSearchParams();
	if (params?.limit) searchParams.set('limit', String(params.limit));
	if (params?.offset) searchParams.set('offset', String(params.offset));

	const query = searchParams.toString();
	return medusaRequest<{
		collections: Collection[];
		count: number;
		offset: number;
		limit: number;
	}>(`/collections${query ? `?${query}` : ''}`);
}

export async function getCollectionByHandle(
	handle: string
): Promise<{ collections: Collection[] }> {
	return medusaRequest<{ collections: Collection[] }>(
		`/collections?handle=${encodeURIComponent(handle)}`
	);
}

// --- Cart ---

export async function createCart(): Promise<{ cart: Cart }> {
	return medusaRequest<{ cart: Cart }>('/carts', {
		method: 'POST',
		body: JSON.stringify({})
	});
}

export async function getCart(cartId: string): Promise<{ cart: Cart }> {
	return medusaRequest<{ cart: Cart }>(`/carts/${cartId}`);
}

export async function addToCart(
	cartId: string,
	variantId: string,
	quantity: number = 1
): Promise<{ cart: Cart }> {
	return medusaRequest<{ cart: Cart }>(`/carts/${cartId}/line-items`, {
		method: 'POST',
		body: JSON.stringify({
			variant_id: variantId,
			quantity
		})
	});
}

export async function updateLineItem(
	cartId: string,
	lineItemId: string,
	quantity: number
): Promise<{ cart: Cart }> {
	return medusaRequest<{ cart: Cart }>(`/carts/${cartId}/line-items/${lineItemId}`, {
		method: 'POST',
		body: JSON.stringify({ quantity })
	});
}

export async function removeLineItem(
	cartId: string,
	lineItemId: string
): Promise<void> {
	await medusaRequest(`/carts/${cartId}/line-items/${lineItemId}`, {
		method: 'DELETE'
	});
}

// --- Checkout ---

export interface ShippingOption {
	id: string;
	name: string;
	amount: number;
	provider_id: string;
}

export interface PaymentCollection {
	id: string;
	payment_sessions: PaymentSession[];
}

export interface PaymentSession {
	id: string;
	provider_id: string;
	status: string;
	data: Record<string, unknown>;
}

export async function updateCart(
	cartId: string,
	data: { email?: string; shipping_address?: Record<string, string>; billing_address?: Record<string, string> }
): Promise<{ cart: Cart }> {
	return medusaRequest<{ cart: Cart }>(`/carts/${cartId}`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

export async function addShippingAddress(
	cartId: string,
	address: {
		first_name: string;
		last_name: string;
		address_1: string;
		city: string;
		country_code: string;
		postal_code: string;
		phone?: string;
	}
): Promise<{ cart: Cart }> {
	return medusaRequest<{ cart: Cart }>(`/carts/${cartId}`, {
		method: 'POST',
		body: JSON.stringify({ shipping_address: address })
	});
}

export async function getShippingOptions(cartId: string): Promise<{ shipping_options: ShippingOption[] }> {
	return medusaRequest<{ shipping_options: ShippingOption[] }>(
		`/shipping-options?cart_id=${cartId}`
	);
}

export async function addShippingMethod(
	cartId: string,
	shippingOptionId: string
): Promise<{ cart: Cart }> {
	return medusaRequest<{ cart: Cart }>(`/carts/${cartId}/shipping-methods`, {
		method: 'POST',
		body: JSON.stringify({ option_id: shippingOptionId })
	});
}

export async function initPaymentSessions(
	cartId: string
): Promise<{ payment_collection: PaymentCollection }> {
	return medusaRequest<{ payment_collection: PaymentCollection }>(
		`/payment-collections`,
		{
			method: 'POST',
			body: JSON.stringify({ cart_id: cartId })
		}
	);
}

export async function initiatePaymentSession(
	paymentCollectionId: string,
	providerId: string
): Promise<{ payment_session: PaymentSession }> {
	return medusaRequest<{ payment_session: PaymentSession }>(
		`/payment-collections/${paymentCollectionId}/payment-sessions`,
		{
			method: 'POST',
			body: JSON.stringify({ provider_id: providerId })
		}
	);
}

export async function setPaymentSession(
	cartId: string,
	providerId: string
): Promise<{ cart: Cart }> {
	return medusaRequest<{ cart: Cart }>(`/carts/${cartId}/payment-sessions`, {
		method: 'POST',
		body: JSON.stringify({ provider_id: providerId })
	});
}

export async function completeCart(cartId: string): Promise<{ type: string; data: unknown }> {
	return medusaRequest<{ type: string; data: unknown }>(`/carts/${cartId}/complete`, {
		method: 'POST'
	});
}

// --- Customer ---

export async function getCustomer(token: string): Promise<{ customer: Customer }> {
	return medusaRequest<{ customer: Customer }>('/customers/me', {
		headers: { Authorization: `Bearer ${token}` }
	});
}

// --- Auth ---

export async function loginMedusa(
	email: string,
	password: string
): Promise<{ token: string }> {
	const response = await fetch(`${BACKEND_URL}/auth/customer/emailpass`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({ message: 'Login failed' }));
		throw new Error(err.message || 'Login failed');
	}

	return response.json();
}

export async function registerMedusaAuth(
	email: string,
	password: string
): Promise<{ token: string }> {
	const response = await fetch(`${BACKEND_URL}/auth/customer/emailpass/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({ message: 'Registration failed' }));
		throw new Error(err.message || 'Registration failed');
	}

	return response.json();
}

export async function createMedusaCustomer(
	token: string,
	data: { email: string; first_name?: string; last_name?: string }
): Promise<{ customer: Customer }> {
	return medusaRequest<{ customer: Customer }>('/customers', {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: JSON.stringify(data)
	});
}
