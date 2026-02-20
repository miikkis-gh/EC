import { env } from '$env/dynamic/private';
import { createLogger } from './logger';

const BACKEND_URL = env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const logger = createLogger('medusa');

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
	promotions?: { code: string }[];
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

export interface Address {
	id: string;
	first_name: string | null;
	last_name: string | null;
	company: string | null;
	address_1: string | null;
	address_2: string | null;
	city: string | null;
	province: string | null;
	postal_code: string | null;
	country_code: string | null;
	phone: string | null;
	is_default_shipping: boolean;
	is_default_billing: boolean;
}

export interface CustomerWithAddresses extends Customer {
	addresses: Address[];
}

export interface OrderItem {
	id: string;
	title: string;
	description: string | null;
	thumbnail: string | null;
	quantity: number;
	unit_price: number;
	total: number;
	variant_title: string | null;
	product_title: string | null;
}

export interface Order {
	id: string;
	display_id: number;
	status: string;
	payment_status: string;
	fulfillment_status: string;
	currency_code: string;
	total: number;
	subtotal: number;
	tax_total: number;
	shipping_total: number;
	discount_total: number;
	items: OrderItem[];
	shipping_address: {
		first_name: string | null;
		last_name: string | null;
		address_1: string | null;
		address_2: string | null;
		city: string | null;
		province: string | null;
		postal_code: string | null;
		country_code: string | null;
		phone: string | null;
	} | null;
	created_at: string;
}

export interface PaginatedResponse<T> {
	count: number;
	offset: number;
	limit: number;
	[key: string]: T[] | number;
}

// --- Generic Fetcher ---

const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

interface MedusaError {
	message: string;
	type: string;
}

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const SAFE_METHODS = new Set(['GET', 'HEAD']);

function isRetryable(method: string, error: unknown, status?: number): boolean {
	if (!SAFE_METHODS.has(method.toUpperCase())) return false;
	if (status && RETRYABLE_STATUS.has(status)) return true;
	// Timeout
	if (error instanceof DOMException && error.name === 'AbortError') return true;
	// Network error (fetch throws TypeError on connection failure)
	if (error instanceof TypeError) return true;
	return false;
}

async function retryDelay(attempt: number): Promise<void> {
	const base = 500 * Math.pow(2, attempt - 1);
	const jitter = Math.random() * base * 0.5;
	await new Promise((resolve) => setTimeout(resolve, base + jitter));
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

	const method = (options.method || 'GET').toUpperCase();
	let lastError: Error | undefined;

	for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

		try {
			const response = await fetch(`${BACKEND_URL}/store${path}`, {
				...options,
				headers,
				signal: controller.signal
			});

			if (!response.ok) {
				if (attempt < MAX_RETRIES && isRetryable(method, null, response.status)) {
					logger.warn('Retrying request', { path, status: response.status, attempt: attempt + 1 });
					clearTimeout(timeout);
					await retryDelay(attempt + 1);
					continue;
				}

				const error: MedusaError = await response.json().catch(() => ({
					message: `Request failed with status ${response.status}`,
					type: 'unknown_error'
				}));
				throw new Error(error.message);
			}

			return response.json();
		} catch (error) {
			clearTimeout(timeout);

			if (error instanceof DOMException && error.name === 'AbortError') {
				lastError = new Error(`Request to ${path} timed out after ${DEFAULT_TIMEOUT_MS}ms`);
			} else if (error instanceof Error) {
				lastError = error;
			} else {
				lastError = new Error(String(error));
			}

			if (attempt < MAX_RETRIES && isRetryable(method, error)) {
				logger.warn('Retrying request', { path, error: lastError.message, attempt: attempt + 1 });
				await retryDelay(attempt + 1);
				continue;
			}

			throw lastError;
		} finally {
			clearTimeout(timeout);
		}
	}

	throw lastError ?? new Error(`Request to ${path} failed after ${MAX_RETRIES + 1} attempts`);
}

// --- Products ---

// --- Regions ---

let cachedRegionId: string | null = null;
let regionCachedAt = 0;
const REGION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getDefaultRegionId(): Promise<string> {
	if (cachedRegionId && Date.now() - regionCachedAt < REGION_CACHE_TTL_MS) {
		return cachedRegionId;
	}
	const data = await medusaRequest<{ regions: { id: string }[] }>('/regions?limit=1');
	cachedRegionId = data.regions[0]?.id ?? '';
	regionCachedAt = Date.now();
	return cachedRegionId;
}

export async function getProducts(params?: {
	limit?: number;
	offset?: number;
	collection_id?: string[];
	category_id?: string[];
	order?: string;
	q?: string;
}): Promise<{ products: Product[]; count: number; offset: number; limit: number }> {
	const regionId = await getDefaultRegionId();
	const searchParams = new URLSearchParams();
	if (params?.limit) searchParams.set('limit', String(params.limit));
	if (params?.offset) searchParams.set('offset', String(params.offset));
	if (params?.order) searchParams.set('order', params.order);
	if (params?.q) searchParams.set('q', params.q);
	if (params?.collection_id) {
		params.collection_id.forEach((id) => searchParams.append('collection_id[]', id));
	}
	if (params?.category_id) {
		params.category_id.forEach((id) => searchParams.append('category_id[]', id));
	}
	searchParams.set('fields', '+variants.calculated_price');
	if (regionId) searchParams.set('region_id', regionId);

	const query = searchParams.toString();
	return medusaRequest<{ products: Product[]; count: number; offset: number; limit: number }>(
		`/products${query ? `?${query}` : ''}`
	);
}

export async function getProductByHandle(
	handle: string
): Promise<{ products: Product[] }> {
	const regionId = await getDefaultRegionId();
	const regionParam = regionId ? `&region_id=${regionId}` : '';
	return medusaRequest<{ products: Product[] }>(
		`/products?handle=${encodeURIComponent(handle)}&fields=+variants.calculated_price${regionParam}`
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

// --- Product Categories ---

export interface ProductCategory {
	id: string;
	name: string;
	handle: string;
	description: string | null;
	parent_category_id: string | null;
}

export async function getProductCategories(params?: {
	limit?: number;
	offset?: number;
}): Promise<{ product_categories: ProductCategory[]; count: number }> {
	const searchParams = new URLSearchParams();
	if (params?.limit) searchParams.set('limit', String(params.limit));
	if (params?.offset) searchParams.set('offset', String(params.offset));

	const query = searchParams.toString();
	return medusaRequest<{ product_categories: ProductCategory[]; count: number }>(
		`/product-categories${query ? `?${query}` : ''}`
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

// --- Promo Codes ---

export async function addPromoCode(
	cartId: string,
	code: string
): Promise<{ cart: Cart }> {
	return medusaRequest<{ cart: Cart }>(`/carts/${cartId}/promotions`, {
		method: 'POST',
		body: JSON.stringify({ promo_codes: [code] })
	});
}

export async function removePromoCode(
	cartId: string,
	code: string
): Promise<{ cart: Cart }> {
	return medusaRequest<{ cart: Cart }>(`/carts/${cartId}/promotions`, {
		method: 'DELETE',
		body: JSON.stringify({ promo_codes: [code] })
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

export async function getCustomerWithAddresses(
	token: string
): Promise<{ customer: CustomerWithAddresses }> {
	return medusaRequest<{ customer: CustomerWithAddresses }>(
		'/customers/me?fields=*addresses',
		{
			headers: { Authorization: `Bearer ${token}` }
		}
	);
}

export async function updateCustomer(
	token: string,
	data: { first_name?: string; last_name?: string; phone?: string }
): Promise<{ customer: Customer }> {
	return medusaRequest<{ customer: Customer }>('/customers/me', {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: JSON.stringify(data)
	});
}

export async function getCustomerOrders(
	token: string,
	params?: { limit?: number; offset?: number }
): Promise<{ orders: Order[]; count: number; offset: number; limit: number }> {
	const searchParams = new URLSearchParams();
	if (params?.limit) searchParams.set('limit', String(params.limit));
	if (params?.offset) searchParams.set('offset', String(params.offset));
	searchParams.set('fields', '+items,+shipping_address');
	searchParams.set('order', '-created_at');

	const query = searchParams.toString();
	return medusaRequest<{ orders: Order[]; count: number; offset: number; limit: number }>(
		`/orders${query ? `?${query}` : ''}`,
		{
			headers: { Authorization: `Bearer ${token}` }
		}
	);
}

export async function getOrder(
	token: string,
	orderId: string
): Promise<{ order: Order }> {
	return medusaRequest<{ order: Order }>(
		`/orders/${orderId}?fields=+items,+shipping_address`,
		{
			headers: { Authorization: `Bearer ${token}` }
		}
	);
}

export async function addCustomerAddress(
	token: string,
	address: Record<string, string>
): Promise<{ customer: CustomerWithAddresses }> {
	return medusaRequest<{ customer: CustomerWithAddresses }>(
		'/customers/me/addresses',
		{
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
			body: JSON.stringify(address)
		}
	);
}

export async function updateCustomerAddress(
	token: string,
	addressId: string,
	data: Record<string, string>
): Promise<{ customer: CustomerWithAddresses }> {
	return medusaRequest<{ customer: CustomerWithAddresses }>(
		`/customers/me/addresses/${addressId}`,
		{
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` },
			body: JSON.stringify(data)
		}
	);
}

export async function deleteCustomerAddress(
	token: string,
	addressId: string
): Promise<void> {
	await medusaRequest(`/customers/me/addresses/${addressId}`, {
		method: 'DELETE',
		headers: { Authorization: `Bearer ${token}` }
	});
}

// --- Auth ---

export async function loginMedusa(
	email: string,
	password: string
): Promise<{ token: string }> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

	try {
		const response = await fetch(`${BACKEND_URL}/auth/customer/emailpass`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
			signal: controller.signal
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({ message: 'Login failed' }));
			throw new Error(err.message || 'Login failed');
		}

		return response.json();
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new Error('Login request timed out. Please try again.');
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
}

export async function registerMedusaAuth(
	email: string,
	password: string
): Promise<{ token: string }> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

	try {
		const response = await fetch(`${BACKEND_URL}/auth/customer/emailpass/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password }),
			signal: controller.signal
		});

		if (!response.ok) {
			const err = await response.json().catch(() => ({ message: 'Registration failed' }));
			throw new Error(err.message || 'Registration failed');
		}

		return response.json();
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new Error('Registration request timed out. Please try again.');
		}
		throw error;
	} finally {
		clearTimeout(timeout);
	}
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
