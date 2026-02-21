<script lang="ts">
	let email = $state('');
	let status: 'idle' | 'submitting' | 'success' | 'error' = $state('idle');
	let errorMessage = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!email.trim() || status === 'submitting') return;

		status = 'submitting';
		errorMessage = '';

		try {
			const response = await fetch('/api/newsletter', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim() })
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to subscribe');
			}

			status = 'success';
			email = '';
		} catch (err) {
			status = 'error';
			errorMessage = err instanceof Error ? err.message : 'Something went wrong';
		}
	}
</script>

<section class="rounded-xl bg-neutral-900 px-6 py-10 text-center sm:px-12">
	<h3 class="font-heading text-xl font-bold text-white">Stay in the loop</h3>
	<p class="mx-auto mt-2 max-w-md text-sm text-neutral-400">
		Get notified about new products, exclusive offers, and style tips.
	</p>

	{#if status === 'success'}
		<p class="mt-6 text-sm font-medium text-green-400">
			Thanks for subscribing! Check your inbox soon.
		</p>
	{:else}
		<form onsubmit={handleSubmit} class="mx-auto mt-6 flex max-w-md gap-2">
			<input
				type="email"
				bind:value={email}
				placeholder="Enter your email"
				required
				class="flex-1 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			/>
			<button
				type="submit"
				disabled={status === 'submitting'}
				class="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
			>
				{status === 'submitting' ? 'Subscribing...' : 'Subscribe'}
			</button>
		</form>
		{#if status === 'error'}
			<p class="mt-2 text-sm text-red-400">{errorMessage}</p>
		{/if}
	{/if}
</section>
