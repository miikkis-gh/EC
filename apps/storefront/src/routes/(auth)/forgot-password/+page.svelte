<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$ui/button';
	import { Input } from '$ui/input';
	import { Label } from '$ui/label';

	interface Props {
		form: { error?: string; email?: string; success?: boolean } | null;
	}

	let { form }: Props = $props();
</script>

<svelte:head>
	<title>Forgot Password — EC1</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
	<div class="text-center">
		<h1 class="font-heading text-2xl font-bold text-neutral-900">Forgot your password?</h1>
		<p class="mt-2 text-sm text-neutral-500">
			Enter your email and we'll send you a reset link.
		</p>
	</div>

	<div class="mt-8">
		{#if form?.success}
			<div class="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
				<svg class="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
				</svg>
				<h2 class="mt-4 font-heading text-lg font-semibold text-neutral-900">Check your email</h2>
				<p class="mt-2 text-sm text-neutral-600">
					If an account exists for <strong>{form.email}</strong>, we've sent a password reset link.
				</p>
				<a href="/login" class="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
					Back to login
				</a>
			</div>
		{:else}
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

				<Button type="submit" class="w-full">Send reset link</Button>
			</form>

			<p class="mt-6 text-center text-sm text-neutral-500">
				Remember your password?
				<a href="/login" class="font-medium text-primary-600 hover:text-primary-700">
					Sign in
				</a>
			</p>
		{/if}
	</div>
</div>
