import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
vi.mock('./db', () => ({
	queryOne: vi.fn(),
	queryMany: vi.fn(),
	execute: vi.fn()
}));

// Mock node:crypto
vi.mock('node:crypto', () => ({
	default: { randomUUID: () => 'test-uuid-123' },
	randomUUID: () => 'test-uuid-123'
}));

import { queryOne, queryMany, execute } from './db';
import {
	getProductReviews,
	getProductReviewStats,
	getUserReview,
	createOrUpdateReview,
	deleteReview
} from './reviews';

const mockQueryOne = vi.mocked(queryOne);
const mockQueryMany = vi.mocked(queryMany);
const mockExecute = vi.mocked(execute);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getProductReviews', () => {
	it('returns reviews with user info ordered by newest', async () => {
		const mockReviews = [
			{
				id: 'r1',
				user_id: 'u1',
				product_id: 'p1',
				rating: 5,
				title: 'Great product',
				content: 'Loved it',
				created_at: '2026-02-20T00:00:00Z',
				updated_at: '2026-02-20T00:00:00Z',
				user_email: 'user@example.com',
				user_first_name: 'John'
			}
		];
		mockQueryMany.mockResolvedValueOnce(mockReviews);

		const result = await getProductReviews('p1');

		expect(result).toEqual(mockReviews);
		expect(mockQueryMany).toHaveBeenCalledOnce();
		expect(mockQueryMany.mock.calls[0][1]).toEqual(['p1']);
	});

	it('returns empty array when no reviews exist', async () => {
		mockQueryMany.mockResolvedValueOnce([]);

		const result = await getProductReviews('p-none');

		expect(result).toEqual([]);
	});
});

describe('getProductReviewStats', () => {
	it('calculates correct distribution and average', async () => {
		mockQueryOne.mockResolvedValueOnce({
			avg_rating: '4.3333333',
			total_count: '3',
			count_1: '0',
			count_2: '0',
			count_3: '1',
			count_4: '0',
			count_5: '2'
		});

		const result = await getProductReviewStats('p1');

		expect(result).toEqual({
			averageRating: 4.3,
			totalCount: 3,
			distribution: [0, 0, 1, 0, 2]
		});
	});

	it('returns zeroed stats when no reviews', async () => {
		mockQueryOne.mockResolvedValueOnce({
			avg_rating: '0',
			total_count: '0',
			count_1: '0',
			count_2: '0',
			count_3: '0',
			count_4: '0',
			count_5: '0'
		});

		const result = await getProductReviewStats('p-empty');

		expect(result).toEqual({
			averageRating: 0,
			totalCount: 0,
			distribution: [0, 0, 0, 0, 0]
		});
	});

	it('returns defaults when queryOne returns null', async () => {
		mockQueryOne.mockResolvedValueOnce(null);

		const result = await getProductReviewStats('p-null');

		expect(result).toEqual({
			averageRating: 0,
			totalCount: 0,
			distribution: [0, 0, 0, 0, 0]
		});
	});
});

describe('getUserReview', () => {
	it('returns user review when it exists', async () => {
		const mockReview = {
			id: 'r1',
			user_id: 'u1',
			product_id: 'p1',
			rating: 4,
			title: 'Good',
			content: null,
			created_at: '2026-02-20T00:00:00Z',
			updated_at: '2026-02-20T00:00:00Z',
			user_email: 'user@example.com',
			user_first_name: null
		};
		mockQueryOne.mockResolvedValueOnce(mockReview);

		const result = await getUserReview('u1', 'p1');

		expect(result).toEqual(mockReview);
		expect(mockQueryOne.mock.calls[0][1]).toEqual(['u1', 'p1']);
	});

	it('returns null when user has no review', async () => {
		mockQueryOne.mockResolvedValueOnce(null);

		const result = await getUserReview('u1', 'p-none');

		expect(result).toBeNull();
	});
});

describe('createOrUpdateReview', () => {
	it('calls execute with correct parameters including generated UUID', async () => {
		mockExecute.mockResolvedValueOnce(undefined);

		await createOrUpdateReview('u1', 'p1', 5, 'Amazing', 'Best product ever');

		expect(mockExecute).toHaveBeenCalledOnce();
		const [sql, params] = mockExecute.mock.calls[0];
		expect(sql).toContain('INSERT INTO product_review');
		expect(sql).toContain('ON CONFLICT');
		expect(params).toEqual(['test-uuid-123', 'u1', 'p1', 5, 'Amazing', 'Best product ever']);
	});

	it('passes null content when content is omitted', async () => {
		mockExecute.mockResolvedValueOnce(undefined);

		await createOrUpdateReview('u1', 'p1', 3, 'OK');

		const params = mockExecute.mock.calls[0][1];
		expect(params![5]).toBeNull();
	});
});

describe('deleteReview', () => {
	it('deletes review scoped to the user', async () => {
		mockExecute.mockResolvedValueOnce(undefined);

		await deleteReview('u1', 'r1');

		expect(mockExecute).toHaveBeenCalledOnce();
		const [sql, params] = mockExecute.mock.calls[0];
		expect(sql).toContain('DELETE FROM product_review');
		expect(sql).toContain('user_id = $2');
		expect(params).toEqual(['r1', 'u1']);
	});
});
