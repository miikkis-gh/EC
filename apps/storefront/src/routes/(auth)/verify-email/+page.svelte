<script lang="ts">
	import { Button } from '$ui/button';

	interface Props {
		data: {
			verified: boolean;
			error?: string;
		};
	}

	let { data }: Props = $props();

	let resending = $state(false);
	let resendResult = $state<{ success?: boolean; error?: string } | null>(null);

	async function resendVerification() {
		resending = true;
		resendResult = null;

		try {
			const res = await fetch('/api/auth/resend-verification', { method: 'POST' });
			if (res.ok) {
				resendResult = { success: true };
			} else {
				const body = await res.json().catch(() => ({}));
				resendResult = { error: body.error || 'Failed to resend. Please try again.' };
			}
		} catch {
			resendResult = { error: 'Failed to resend. Please try again.' };
		} finally {
			resending = false;
		}
	}
</script>

<svelte:head>
	<title>Verify Email — EC1</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
	<div class="text-center">
		{#if data.verified}
			<div class="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
				<svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
				</svg>
			</div>
			<h1 class="font-heading text-2xl font-bold text-neutral-900">Email Verified</h1>
			<p class="mt-2 text-sm text-neutral-500">
				Your email has been verified. You can now proceed to checkout.
			</p>
			<div class="mt-6 space-y-3">
				<Button href="/account" class="w-full">Go to Account</Button>
				<Button href="/" variant="outline" class="w-full">Continue Shopping</Button>
			</div>
		{:else}
			<div class="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
				<svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</div>
			<h1 class="font-heading text-2xl font-bold text-neutral-900">Verification Failed</h1>
			<p class="mt-2 text-sm text-neutral-500">
				{data.error || 'This link is expired or invalid.'}
			</p>

			{#if resendResult?.success}
				<div class="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
					A new verification email has been sent. Check your inbox.
				</div>
			{:else if resendResult?.error}
				<div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{resendResult.error}
				</div>
			{/if}

			<div class="mt-6 space-y-3">
				<Button onclick={resendVerification} disabled={resending} class="w-full">
					{resending ? 'Sending...' : 'Resend Verification Email'}
				</Button>
				<Button href="/login" variant="outline" class="w-full">Back to Login</Button>
			</div>
		{/if}
	</div>
</div>
