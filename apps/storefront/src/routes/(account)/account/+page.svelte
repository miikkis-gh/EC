<script lang="ts">
	import { Button } from '$ui/button';
	import { startRegistration } from '@simplewebauthn/browser';

	interface Props {
		data: {
			user: { id: string; email: string; medusaCustomerId: string | null };
			customer: { first_name: string | null; last_name: string | null; email: string } | null;
			passkeys: { id: string; name: string; createdAt: string }[];
		};
	}

	let { data }: Props = $props();
	let localPasskeys = $state<{ id: string; name: string; createdAt: string }[] | null>(null);
	let passkeys = $derived(localPasskeys ?? data.passkeys);
	let addingPasskey = $state(false);
	let passkeyError = $state('');

	async function addPasskey() {
		addingPasskey = true;
		passkeyError = '';

		try {
			const optionsRes = await fetch('/api/auth/passkey/register');
			if (!optionsRes.ok) throw new Error('Failed to get registration options');

			const { options, challengeKey } = await optionsRes.json();
			const credential = await startRegistration({ optionsJSON: options });

			const verifyRes = await fetch('/api/auth/passkey/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					challengeKey,
					credential,
					name: `Passkey ${passkeys.length + 1}`
				})
			});

			if (!verifyRes.ok) throw new Error('Failed to register passkey');

			// Add to list locally
			localPasskeys = [
				{ id: crypto.randomUUID(), name: `Passkey ${passkeys.length + 1}`, createdAt: new Date().toISOString() },
				...passkeys
			];
		} catch (err) {
			if (err instanceof Error && err.name === 'NotAllowedError') {
				passkeyError = 'Passkey registration was cancelled';
			} else {
				passkeyError = 'Failed to add passkey. Please try again.';
			}
		} finally {
			addingPasskey = false;
		}
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Account — EC1</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="font-heading text-3xl font-bold text-neutral-900">My Account</h1>
		<form method="POST" action="/api/auth/logout">
			<Button variant="outline" type="submit">Sign out</Button>
		</form>
	</div>

	<!-- Profile -->
	<section class="rounded-xl border border-neutral-200 bg-white p-6">
		<h2 class="font-heading text-lg font-semibold text-neutral-900">Profile</h2>
		<dl class="mt-4 space-y-3">
			<div>
				<dt class="text-sm font-medium text-neutral-500">Email</dt>
				<dd class="text-sm text-neutral-900">{data.user.email}</dd>
			</div>
			{#if data.customer?.first_name || data.customer?.last_name}
				<div>
					<dt class="text-sm font-medium text-neutral-500">Name</dt>
					<dd class="text-sm text-neutral-900">
						{[data.customer.first_name, data.customer.last_name].filter(Boolean).join(' ')}
					</dd>
				</div>
			{/if}
		</dl>
	</section>

	<!-- Passkeys -->
	<section class="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
		<div class="flex items-center justify-between">
			<h2 class="font-heading text-lg font-semibold text-neutral-900">Passkeys</h2>
			<Button variant="outline" size="sm" onclick={addPasskey} disabled={addingPasskey}>
				{addingPasskey ? 'Adding...' : 'Add passkey'}
			</Button>
		</div>

		{#if passkeyError}
			<p class="mt-3 text-sm text-red-600">{passkeyError}</p>
		{/if}

		{#if passkeys.length > 0}
			<ul class="mt-4 divide-y divide-neutral-100">
				{#each passkeys as passkey (passkey.id)}
					<li class="flex items-center justify-between py-3">
						<div>
							<p class="text-sm font-medium text-neutral-900">{passkey.name}</p>
							<p class="text-xs text-neutral-400">Added {formatDate(passkey.createdAt)}</p>
						</div>
						<svg class="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33" />
						</svg>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-4 text-sm text-neutral-400">No passkeys registered. Add one for passwordless login.</p>
		{/if}
	</section>
</div>
