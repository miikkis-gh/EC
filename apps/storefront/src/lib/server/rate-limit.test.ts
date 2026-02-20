import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('allows requests within the limit', () => {
		const limiter = createRateLimiter({ points: 3, windowMs: 60_000 });

		expect(limiter.consume('user-1').allowed).toBe(true);
		expect(limiter.consume('user-1').allowed).toBe(true);
		expect(limiter.consume('user-1').allowed).toBe(true);
	});

	it('blocks requests after the limit is exhausted', () => {
		const limiter = createRateLimiter({ points: 2, windowMs: 60_000 });

		expect(limiter.consume('user-1').allowed).toBe(true);
		expect(limiter.consume('user-1').allowed).toBe(true);

		const result = limiter.consume('user-1');
		expect(result.allowed).toBe(false);
		expect(result.retryAfter).toBeGreaterThan(0);
	});

	it('tracks keys independently', () => {
		const limiter = createRateLimiter({ points: 1, windowMs: 60_000 });

		expect(limiter.consume('user-1').allowed).toBe(true);
		expect(limiter.consume('user-2').allowed).toBe(true);

		expect(limiter.consume('user-1').allowed).toBe(false);
		expect(limiter.consume('user-2').allowed).toBe(false);
	});

	it('allows requests again after the window expires', () => {
		const limiter = createRateLimiter({ points: 1, windowMs: 10_000 });

		expect(limiter.consume('user-1').allowed).toBe(true);
		expect(limiter.consume('user-1').allowed).toBe(false);

		// Advance past the window
		vi.advanceTimersByTime(10_001);

		expect(limiter.consume('user-1').allowed).toBe(true);
	});

	it('returns correct retryAfter in seconds', () => {
		const limiter = createRateLimiter({ points: 1, windowMs: 30_000 });

		limiter.consume('user-1');
		const result = limiter.consume('user-1');

		expect(result.allowed).toBe(false);
		expect(result.retryAfter).toBe(30);
	});

	it('returns retryAfter of 0 when allowed', () => {
		const limiter = createRateLimiter({ points: 5, windowMs: 60_000 });

		const result = limiter.consume('user-1');
		expect(result.retryAfter).toBe(0);
	});

	it('uses a sliding window (oldest request expires first)', () => {
		const limiter = createRateLimiter({ points: 2, windowMs: 10_000 });

		// First request at t=0
		limiter.consume('user-1');

		// Second request at t=5s
		vi.advanceTimersByTime(5_000);
		limiter.consume('user-1');

		// At t=5s, both are in the window, so blocked
		expect(limiter.consume('user-1').allowed).toBe(false);

		// At t=10.001s, the first request has expired, one slot opens
		vi.advanceTimersByTime(5_001);
		expect(limiter.consume('user-1').allowed).toBe(true);
	});
});
