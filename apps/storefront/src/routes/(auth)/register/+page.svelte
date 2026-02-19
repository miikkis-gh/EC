<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$ui/button';
	import { Input } from '$ui/input';
	import { Label } from '$ui/label';

	interface Props {
		form: { error?: string; email?: string; firstName?: string; lastName?: string } | null;
	}

	let { form }: Props = $props();
</script>

<svelte:head>
	<title>Register — EC1</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
	<div class="text-center">
		<h1 class="font-heading text-2xl font-bold text-neutral-900">Create an account</h1>
		<p class="mt-2 text-sm text-neutral-500">Join us for a better shopping experience</p>
	</div>

	<form method="POST" use:enhance class="mt-8 space-y-4">
		{#if form?.error}
			<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{form.error}
			</div>
		{/if}

		<div class="grid grid-cols-2 gap-4">
			<div class="space-y-2">
				<Label for="first_name">First name</Label>
				<Input
					id="first_name"
					name="first_name"
					type="text"
					autocomplete="given-name"
					value={form?.firstName ?? ''}
				/>
			</div>
			<div class="space-y-2">
				<Label for="last_name">Last name</Label>
				<Input
					id="last_name"
					name="last_name"
					type="text"
					autocomplete="family-name"
					value={form?.lastName ?? ''}
				/>
			</div>
		</div>

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
				autocomplete="new-password"
				required
				minlength={8}
			/>
			<p class="text-xs text-neutral-400">Must be at least 8 characters</p>
		</div>

		<Button type="submit" class="w-full">Create account</Button>
	</form>

	<p class="mt-6 text-center text-sm text-neutral-500">
		Already have an account?
		<a href="/login" class="font-medium text-primary-600 hover:text-primary-700">
			Sign in
		</a>
	</p>
</div>
