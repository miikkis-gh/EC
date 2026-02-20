<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$ui/button';
	import { Input } from '$ui/input';
	import { Label } from '$ui/label';

	interface Props {
		data: { token?: string; tokenMissing?: boolean };
		form: {
			errors?: Record<string, string[]>;
			tokenInvalid?: boolean;
		} | null;
	}

	let { data, form }: Props = $props();
</script>

<svelte:head>
	<title>Reset Password — EC1</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
	<div class="text-center">
		<h1 class="font-heading text-2xl font-bold text-neutral-900">Reset your password</h1>
		<p class="mt-2 text-sm text-neutral-500">Enter your new password below.</p>
	</div>

	<div class="mt-8">
		{#if data.tokenMissing}
			<div class="rounded-xl border border-yellow-200 bg-yellow-50 p-8 text-center">
				<h2 class="font-heading text-lg font-semibold text-yellow-900">Missing reset link</h2>
				<p class="mt-2 text-sm text-yellow-700">
					This page requires a valid reset link. Please request a new one.
				</p>
				<a href="/forgot-password" class="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
					Request a new link
				</a>
			</div>
		{:else if form?.tokenInvalid}
			<div class="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
				<h2 class="font-heading text-lg font-semibold text-red-900">Invalid or expired link</h2>
				<p class="mt-2 text-sm text-red-700">
					This reset link has expired or already been used. Please request a new one.
				</p>
				<a href="/forgot-password" class="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
					Request a new link
				</a>
			</div>
		{:else}
			<form method="POST" use:enhance class="space-y-4">
				<input type="hidden" name="token" value={data.token} />

				{#if form?.errors?.password}
					<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{form.errors.password[0]}
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="password">New password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
						minlength={8}
					/>
					<p class="text-xs text-neutral-400">Must be at least 8 characters</p>
				</div>

				<div class="space-y-2">
					<Label for="confirmPassword">Confirm password</Label>
					<Input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						autocomplete="new-password"
						required
					/>
					{#if form?.errors?.confirmPassword}
						<p class="text-sm text-red-600">{form.errors.confirmPassword[0]}</p>
					{/if}
				</div>

				<Button type="submit" class="w-full">Reset password</Button>
			</form>
		{/if}
	</div>
</div>
