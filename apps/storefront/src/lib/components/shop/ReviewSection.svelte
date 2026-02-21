<script lang="ts">
	import ReviewStars from './ReviewStars.svelte';
	import { cn } from '$utils';
	import { page } from '$app/stores';
	import type { Review, ReviewStats } from '$server/reviews';

	interface Props {
		productId: string;
		reviews: Review[];
		stats: ReviewStats;
		userReview: Review | null;
	}

	let { productId, reviews: propReviews, stats: propStats, userReview: propUserReview }: Props = $props();

	let reviews = $state<Review[]>([]);
	let stats = $state<ReviewStats>({ averageRating: 0, totalCount: 0, distribution: [0, 0, 0, 0, 0] });
	let userReview = $state<Review | null>(null);
	let showForm = $state(false);
	let submitting = $state(false);
	let deleting = $state(false);
	let errorMessage = $state('');

	// Form fields
	let rating = $state(0);
	let title = $state('');
	let content = $state('');

	let user = $derived($page.data.user);
	let isEditing = $derived(!!userReview);

	// Sync from props on mount / navigation
	$effect(() => {
		reviews = propReviews;
		stats = propStats;
		userReview = propUserReview;
	});

	function openForm() {
		if (userReview) {
			rating = userReview.rating;
			title = userReview.title;
			content = userReview.content ?? '';
		} else {
			rating = 0;
			title = '';
			content = '';
		}
		showForm = true;
		errorMessage = '';
	}

	async function handleSubmit() {
		if (rating === 0) {
			errorMessage = 'Please select a rating';
			return;
		}
		if (!title.trim()) {
			errorMessage = 'Please enter a title';
			return;
		}

		submitting = true;
		errorMessage = '';

		try {
			const res = await fetch('/api/reviews', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					productId,
					rating,
					title: title.trim(),
					content: content.trim() || undefined
				})
			});

			const data = await res.json();
			if (!res.ok) {
				errorMessage = data.error || 'Failed to submit review';
				return;
			}

			// Refresh reviews
			await refreshReviews();
			showForm = false;
		} catch {
			errorMessage = 'Failed to submit review';
		} finally {
			submitting = false;
		}
	}

	async function handleDelete() {
		if (!userReview) return;

		deleting = true;
		errorMessage = '';

		try {
			const res = await fetch('/api/reviews', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reviewId: userReview.id })
			});

			const data = await res.json();
			if (!res.ok) {
				errorMessage = data.error || 'Failed to delete review';
				return;
			}

			userReview = null;
			showForm = false;
			await refreshReviews();
		} catch {
			errorMessage = 'Failed to delete review';
		} finally {
			deleting = false;
		}
	}

	async function refreshReviews() {
		try {
			const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
			const data = await res.json();
			if (res.ok) {
				reviews = data.reviews;
				stats = data.stats;
				// Find the user's review in the updated list
				if (user) {
					userReview = reviews.find((r: Review) => r.user_id === user!.id) ?? null;
				}
			}
		} catch {
			// Non-critical refresh failure
		}
	}

	function getDisplayName(review: Review): string {
		if (review.user_first_name) return review.user_first_name;
		return review.user_email.split('@')[0];
	}

	function getInitial(review: Review): string {
		if (review.user_first_name) return review.user_first_name[0].toUpperCase();
		return review.user_email[0].toUpperCase();
	}

	function formatRelativeDate(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 30) return `${diffDays} days ago`;
		if (diffDays < 365) {
			const months = Math.floor(diffDays / 30);
			return `${months} ${months === 1 ? 'month' : 'months'} ago`;
		}
		const years = Math.floor(diffDays / 365);
		return `${years} ${years === 1 ? 'year' : 'years'} ago`;
	}
</script>

<section id="reviews" class="mt-16">
	<h2 class="font-heading text-2xl font-bold text-neutral-900">Customer Reviews</h2>

	<!-- Summary -->
	<div class="mt-6 flex flex-col gap-8 sm:flex-row sm:items-start">
		<!-- Average rating -->
		<div class="flex flex-col items-center sm:items-start">
			<div class="text-4xl font-bold text-neutral-900">
				{stats.totalCount > 0 ? stats.averageRating.toFixed(1) : '—'}
			</div>
			<ReviewStars rating={stats.averageRating} class="mt-1" />
			<p class="mt-1 text-sm text-neutral-500">
				{stats.totalCount} {stats.totalCount === 1 ? 'review' : 'reviews'}
			</p>
		</div>

		<!-- Rating distribution -->
		{#if stats.totalCount > 0}
			<div class="flex-1 space-y-1.5">
				{#each [5, 4, 3, 2, 1] as star (star)}
					{@const count = stats.distribution[star - 1]}
					{@const pct = stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0}
					<div class="flex items-center gap-2 text-sm">
						<span class="w-6 text-right text-neutral-600">{star}</span>
						<svg class="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
							<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
						</svg>
						<div class="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
							<div
								class="h-full rounded-full bg-amber-400 transition-all"
								style="width: {pct}%"
							></div>
						</div>
						<span class="w-8 text-neutral-500">{count}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Write/Edit Review Button -->
	<div class="mt-8">
		{#if user}
			{#if !showForm}
				<button
					onclick={openForm}
					class="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
				>
					{isEditing ? 'Edit Your Review' : 'Write a Review'}
				</button>
			{/if}
		{:else}
			<a
				href="/login"
				class="inline-block rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
			>
				Log in to write a review
			</a>
		{/if}
	</div>

	<!-- Review Form -->
	{#if showForm && user}
		<div class="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-6">
			<h3 class="text-lg font-semibold text-neutral-900">
				{isEditing ? 'Edit Your Review' : 'Write a Review'}
			</h3>

			{#if errorMessage}
				<p class="mt-3 text-sm text-red-600">{errorMessage}</p>
			{/if}

			<!-- Star rating selector -->
			<div class="mt-4">
				<span class="text-sm font-medium text-neutral-700" id="rating-label">Rating</span>
				<div class="mt-1 flex gap-1" role="radiogroup" aria-labelledby="rating-label">
					{#each [1, 2, 3, 4, 5] as star (star)}
						<button
							type="button"
							onclick={() => rating = star}
							class="p-0.5 transition-transform hover:scale-110"
							aria-label="{star} star{star !== 1 ? 's' : ''}"
						>
							<svg
								class={cn('h-7 w-7', star <= rating ? 'text-amber-400' : 'text-neutral-300')}
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
						</button>
					{/each}
				</div>
			</div>

			<!-- Title -->
			<div class="mt-4">
				<label for="review-title" class="text-sm font-medium text-neutral-700">Title</label>
				<input
					id="review-title"
					type="text"
					bind:value={title}
					maxlength={200}
					placeholder="Summarize your experience"
					class="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
				/>
			</div>

			<!-- Content -->
			<div class="mt-4">
				<label for="review-content" class="text-sm font-medium text-neutral-700">
					Review <span class="text-neutral-400">(optional)</span>
				</label>
				<textarea
					id="review-content"
					bind:value={content}
					maxlength={5000}
					rows={4}
					placeholder="Tell others about your experience with this product"
					class="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
				></textarea>
			</div>

			<!-- Actions -->
			<div class="mt-6 flex items-center gap-3">
				<button
					onclick={handleSubmit}
					disabled={submitting}
					class="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{submitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
				</button>
				<button
					onclick={() => { showForm = false; errorMessage = ''; }}
					class="rounded-lg px-4 py-2.5 text-sm text-neutral-600 transition-colors hover:text-neutral-900"
				>
					Cancel
				</button>
				{#if isEditing}
					<button
						onclick={handleDelete}
						disabled={deleting}
						class="ml-auto rounded-lg px-4 py-2.5 text-sm text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{deleting ? 'Deleting...' : 'Delete Review'}
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Review list -->
	{#if reviews.length > 0}
		<div class="mt-8 divide-y divide-neutral-200">
			{#each reviews as review (review.id)}
				<div class="py-6 first:pt-0">
					<div class="flex items-start gap-3">
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
							{getInitial(review)}
						</div>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium text-neutral-900">
									{getDisplayName(review)}
								</span>
								<span class="text-sm text-neutral-400">
									{formatRelativeDate(review.created_at)}
								</span>
							</div>
							<ReviewStars rating={review.rating} size="sm" class="mt-0.5" />
							<h4 class="mt-2 text-sm font-semibold text-neutral-900">{review.title}</h4>
							{#if review.content}
								<p class="mt-1 text-sm text-neutral-600">{review.content}</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="mt-8 text-sm text-neutral-500">No reviews yet. Be the first to share your thoughts!</p>
	{/if}
</section>
