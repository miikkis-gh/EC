<script lang="ts">
	import { Button } from '$ui/button';

	interface Props {
		data: {
			order: Record<string, unknown> | null;
			status: string;
		};
	}

	let { data }: Props = $props();
	let success = $derived(data.status === 'succeeded');
	let orderId = $derived(
		data.order?.id ? String(data.order.id) : null
	);
</script>

<svelte:head>
	<title>{success ? 'Order Confirmed' : 'Payment Issue'} — EC1</title>
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-24 sm:px-6 lg:px-8">
	{#if success}
		<div class="text-center">
			<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
				<svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
				</svg>
			</div>

			<h1 class="mt-6 font-heading text-2xl font-bold text-neutral-900">Order confirmed</h1>
			<p class="mt-2 text-sm text-neutral-500">
				Thank you for your purchase! We've received your order and will begin processing it shortly.
			</p>

			{#if orderId}
				<p class="mt-4 text-sm text-neutral-600">
					Order ID: <span class="font-mono font-medium">{orderId}</span>
				</p>
			{/if}

			<div class="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
				<a href="/products">
					<Button variant="outline">Continue shopping</Button>
				</a>
				<a href="/account">
					<Button>View account</Button>
				</a>
			</div>
		</div>
	{:else}
		<div class="text-center">
			<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
				<svg class="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
				</svg>
			</div>

			<h1 class="mt-6 font-heading text-2xl font-bold text-neutral-900">Payment issue</h1>
			<p class="mt-2 text-sm text-neutral-500">
				There was a problem processing your payment. Your cart has been preserved — please try again.
			</p>

			<div class="mt-8">
				<a href="/checkout">
					<Button>Return to checkout</Button>
				</a>
			</div>
		</div>
	{/if}
</div>
