import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter } from './rate-limit';

// Mock redis module — default: no Redis available
vi.mock('./redis', () => ({
	getRedisClient: vi.fn(() => null)
}));

// Mock logger to avoid console noise
vi.mock('./logger', () => ({
	createLogger: () => ({
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	})
}));

import { getRedisClient } from './redis';

const mockGetRedisClient = vi.mocked(getRedisClient);

describe('createRateLimiter — in-memory fallback', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockGetRedisClient.mockReturnValue(null);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('allows requests within the limit', async () => {
		const limiter = createRateLimiter({ points: 3, windowMs: 60_000 });

		expect((await limiter.consume('user-1')).allowed).toBe(true);
		expect((await limiter.consume('user-1')).allowed).toBe(true);
		expect((await limiter.consume('user-1')).allowed).toBe(true);
	});

	it('blocks requests after the limit is exhausted', async () => {
		const limiter = createRateLimiter({ points: 2, windowMs: 60_000 });

		expect((await limiter.consume('user-1')).allowed).toBe(true);
		expect((await limiter.consume('user-1')).allowed).toBe(true);

		const result = await limiter.consume('user-1');
		expect(result.allowed).toBe(false);
		expect(result.retryAfter).toBeGreaterThan(0);
	});

	it('tracks keys independently', async () => {
		const limiter = createRateLimiter({ points: 1, windowMs: 60_000 });

		expect((await limiter.consume('user-1')).allowed).toBe(true);
		expect((await limiter.consume('user-2')).allowed).toBe(true);

		expect((await limiter.consume('user-1')).allowed).toBe(false);
		expect((await limiter.consume('user-2')).allowed).toBe(false);
	});

	it('allows requests again after the window expires', async () => {
		const limiter = createRateLimiter({ points: 1, windowMs: 10_000 });

		expect((await limiter.consume('user-1')).allowed).toBe(true);
		expect((await limiter.consume('user-1')).allowed).toBe(false);

		vi.advanceTimersByTime(10_001);

		expect((await limiter.consume('user-1')).allowed).toBe(true);
	});

	it('returns correct retryAfter in seconds', async () => {
		const limiter = createRateLimiter({ points: 1, windowMs: 30_000 });

		await limiter.consume('user-1');
		const result = await limiter.consume('user-1');

		expect(result.allowed).toBe(false);
		expect(result.retryAfter).toBe(30);
	});

	it('returns retryAfter of 0 when allowed', async () => {
		const limiter = createRateLimiter({ points: 5, windowMs: 60_000 });

		const result = await limiter.consume('user-1');
		expect(result.retryAfter).toBe(0);
	});

	it('uses a sliding window (oldest request expires first)', async () => {
		const limiter = createRateLimiter({ points: 2, windowMs: 10_000 });

		await limiter.consume('user-1');

		vi.advanceTimersByTime(5_000);
		await limiter.consume('user-1');

		expect((await limiter.consume('user-1')).allowed).toBe(false);

		vi.advanceTimersByTime(5_001);
		expect((await limiter.consume('user-1')).allowed).toBe(true);
	});
});

describe('createRateLimiter — Redis', () => {
	let mockRedisEval: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockRedisEval = vi.fn();
		mockGetRedisClient.mockReturnValue({
			eval: mockRedisEval
		} as never);
	});

	afterEach(() => {
		mockGetRedisClient.mockReturnValue(null);
	});

	it('returns allowed when Redis Lua script allows', async () => {
		mockRedisEval.mockResolvedValue([1, 0]);

		const limiter = createRateLimiter({ points: 10, windowMs: 60_000, prefix: 'test' });
		const result = await limiter.consume('key-1');

		expect(result.allowed).toBe(true);
		expect(result.retryAfter).toBe(0);
		expect(mockRedisEval).toHaveBeenCalledOnce();
	});

	it('returns blocked with retryAfter when Redis Lua script blocks', async () => {
		mockRedisEval.mockResolvedValue([0, 5000]);

		const limiter = createRateLimiter({ points: 1, windowMs: 60_000, prefix: 'test' });
		const result = await limiter.consume('key-1');

		expect(result.allowed).toBe(false);
		expect(result.retryAfter).toBe(5);
	});

	it('falls back to in-memory on Redis error', async () => {
		vi.useFakeTimers();
		mockRedisEval.mockRejectedValue(new Error('Redis connection lost'));

		const limiter = createRateLimiter({ points: 2, windowMs: 60_000, prefix: 'test' });

		// Should still work via fallback
		const result = await limiter.consume('key-1');
		expect(result.allowed).toBe(true);

		vi.useRealTimers();
	});

	it('falls back to in-memory when getRedisClient returns null', async () => {
		vi.useFakeTimers();
		mockGetRedisClient.mockReturnValue(null);

		const limiter = createRateLimiter({ points: 1, windowMs: 60_000, prefix: 'test' });

		expect((await limiter.consume('key-1')).allowed).toBe(true);
		expect((await limiter.consume('key-1')).allowed).toBe(false);

		vi.useRealTimers();
	});
});
