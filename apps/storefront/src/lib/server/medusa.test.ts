import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock $env/dynamic/private before importing medusa module
vi.mock('$env/dynamic/private', () => ({
	env: {
		MEDUSA_BACKEND_URL: 'http://test-backend:9000',
		MEDUSA_PUBLISHABLE_KEY: 'test-key'
	}
}));

// Mock logger
vi.mock('./logger', () => ({
	createLogger: () => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	})
}));

// We need to mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocks are set up
const { medusaRequest } = await import('./medusa');

function jsonResponse(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

describe('medusaRequest — retry logic', () => {
	beforeEach(() => {
		vi.useFakeTimers({ shouldAdvanceTime: true });
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('GET succeeds on first attempt without retry', async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse({ products: [] }));

		const result = await medusaRequest('/products');
		expect(result).toEqual({ products: [] });
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('GET retries on 503 and succeeds on 2nd attempt', async () => {
		mockFetch
			.mockResolvedValueOnce(jsonResponse({ message: 'Service Unavailable' }, 503))
			.mockResolvedValueOnce(jsonResponse({ products: ['ok'] }));

		const result = await medusaRequest('/products');
		expect(result).toEqual({ products: ['ok'] });
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('GET retries on 502 and 504', async () => {
		mockFetch
			.mockResolvedValueOnce(jsonResponse({}, 502))
			.mockResolvedValueOnce(jsonResponse({}, 504))
			.mockResolvedValueOnce(jsonResponse({ data: 'ok' }));

		const result = await medusaRequest('/products');
		expect(result).toEqual({ data: 'ok' });
		expect(mockFetch).toHaveBeenCalledTimes(3);
	});

	it('GET retries on network error (TypeError)', async () => {
		mockFetch
			.mockRejectedValueOnce(new TypeError('fetch failed'))
			.mockResolvedValueOnce(jsonResponse({ ok: true }));

		const result = await medusaRequest('/products');
		expect(result).toEqual({ ok: true });
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('GET fails after max retries on persistent 503', async () => {
		mockFetch
			.mockResolvedValueOnce(jsonResponse({ message: 'down' }, 503))
			.mockResolvedValueOnce(jsonResponse({ message: 'still down' }, 503))
			.mockResolvedValueOnce(jsonResponse({ message: 'still down' }, 503));

		await expect(medusaRequest('/products')).rejects.toThrow('still down');
		expect(mockFetch).toHaveBeenCalledTimes(3);
	});

	it('POST does not retry on 503', async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Service Unavailable' }, 503));

		await expect(
			medusaRequest('/carts/123/line-items', {
				method: 'POST',
				body: JSON.stringify({ variant_id: 'v1', quantity: 1 })
			})
		).rejects.toThrow('Service Unavailable');

		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('DELETE does not retry on 503', async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'fail' }, 503));

		await expect(
			medusaRequest('/carts/123/line-items/item1', { method: 'DELETE' })
		).rejects.toThrow('fail');

		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('GET does not retry on 404', async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Not found', type: 'not_found' }, 404));

		await expect(medusaRequest('/products?handle=missing')).rejects.toThrow('Not found');
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('GET does not retry on 400', async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Bad request', type: 'invalid_data' }, 400));

		await expect(medusaRequest('/products?limit=-1')).rejects.toThrow('Bad request');
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it('GET does not retry on 429', async () => {
		mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'Rate limited', type: 'too_many_requests' }, 429));

		await expect(medusaRequest('/products')).rejects.toThrow('Rate limited');
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});
});
