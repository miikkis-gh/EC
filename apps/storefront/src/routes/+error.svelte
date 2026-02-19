<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$ui/button';
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
	<p class="font-heading text-7xl font-bold text-primary-600">
		{$page.status}
	</p>
	<h1 class="mt-4 font-heading text-3xl font-bold text-neutral-900">
		{#if $page.status === 404}
			Page not found
		{:else}
			Something went wrong
		{/if}
	</h1>
	<p class="mt-2 max-w-md text-neutral-600">
		{#if $page.status === 404}
			The page you're looking for doesn't exist or has been moved.
		{:else if $page.error?.message}
			{$page.error.message}
		{:else}
			An unexpected error occurred. Please try again later.
		{/if}
	</p>
	<div class="mt-8 flex gap-4">
		<Button href="/">Go home</Button>
		<Button href="/products" variant="outline">Browse products</Button>
	</div>
</div>
