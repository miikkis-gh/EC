<script lang="ts">
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
				resendResult = { error: body.error || 'Failed to resend.' };
			}
		} catch {
			resendResult = { error: 'Failed to resend.' };
		} finally {
			resending = false;
		}
	}
</script>

<div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
	<div class="flex items-start gap-3">
		<svg class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
		</svg>
		<div class="flex-1">
			<p class="text-sm font-medium text-amber-800">
				Please verify your email to checkout.
			</p>
			<p class="mt-1 text-sm text-amber-700">
				Check your inbox for a verification link.

				{#if resendResult?.success}
					<span class="font-medium text-green-700">Sent! Check your inbox.</span>
				{:else if resendResult?.error}
					<span class="font-medium text-red-700">{resendResult.error}</span>
				{:else}
					<button
						onclick={resendVerification}
						disabled={resending}
						class="font-medium text-amber-900 underline hover:no-underline disabled:opacity-50"
					>
						{resending ? 'Sending...' : 'Resend verification email'}
					</button>
				{/if}
			</p>
		</div>
	</div>
</div>
