<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$ui/button';
	import { Input } from '$ui/input';
	import { Label } from '$ui/label';
	import { Separator } from '$ui/separator';
	import { startAuthentication } from '@simplewebauthn/browser';

	interface Props {
		form: { error?: string; email?: string } | null;
	}

	let { form }: Props = $props();

	let passkeyLoading = $state(false);
	let passkeyError = $state('');

	async function loginWithPasskey() {
		passkeyLoading = true;
		passkeyError = '';

		try {
			const optionsRes = await fetch('/api/auth/passkey/login');
			if (!optionsRes.ok) throw new Error('Failed to get passkey options');

			const { options, challengeKey } = await optionsRes.json();
			const credential = await startAuthentication({ optionsJSON: options });

			const verifyRes = await fetch('/api/auth/passkey/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ challengeKey, credential })
			});

			if (!verifyRes.ok) throw new Error('Passkey authentication failed');

			window.location.href = '/account';
		} catch (err) {
			if (err instanceof Error && err.name === 'NotAllowedError') {
				passkeyError = 'Passkey authentication was cancelled';
			} else {
				passkeyError = 'Passkey authentication failed. Try email login instead.';
			}
		} finally {
			passkeyLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Login — EC1</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
	<div class="text-center">
		<h1 class="font-heading text-2xl font-bold text-neutral-900">Welcome back</h1>
		<p class="mt-2 text-sm text-neutral-500">Sign in to your account</p>
	</div>

	<div class="mt-8 space-y-6">
		<!-- Passkey login -->
		<div>
			<Button
				class="w-full"
				variant="outline"
				onclick={loginWithPasskey}
				disabled={passkeyLoading}
			>
				<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33" />
				</svg>
				{passkeyLoading ? 'Authenticating...' : 'Sign in with passkey'}
			</Button>
			{#if passkeyError}
				<p class="mt-2 text-center text-sm text-red-600">{passkeyError}</p>
			{/if}
		</div>

		<div class="flex items-center gap-4">
			<Separator class="flex-1" />
			<span class="text-xs text-neutral-400">or continue with email</span>
			<Separator class="flex-1" />
		</div>

		<!-- Email/password form -->
		<form method="POST" use:enhance class="space-y-4">
			{#if form?.error}
				<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{form.error}
				</div>
			{/if}

			<div class="space-y-2">
				<Label for="email">Email</Label>
				<Input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
				/>
			</div>

			<div class="space-y-2">
				<Label for="password">Password</Label>
				<Input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
				/>
			</div>

			<Button type="submit" class="w-full">Sign in</Button>
		</form>

		<p class="text-center text-sm text-neutral-500">
			Don't have an account?
			<a href="/register" class="font-medium text-primary-600 hover:text-primary-700">
				Create one
			</a>
		</p>
	</div>
</div>
