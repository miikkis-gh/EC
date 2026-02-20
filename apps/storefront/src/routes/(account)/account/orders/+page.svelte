<script lang="ts">
	import { Badge } from '$ui/badge';
	import { Button } from '$ui/button';
	import { Package } from '@lucide/svelte';
	import { formatPrice, formatDate } from '$utils/format';
	import type { Order } from '$server/medusa';

	interface Props {
		data: {
			orders: Order[];
			count: number;
			page: number;
			perPage: number;
		};
	}

	let { data }: Props = $props();
	let totalPages = $derived(Math.ceil(data.count / data.perPage));

	function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
		switch (status) {
			case 'completed':
				return 'default';
			case 'pending':
			case 'requires_action':
				return 'secondary';
			default:
				return 'outline';
		}
	}
</script>

<svelte:head>
	<title>Orders — EC1</title>
</svelte:head>

<section class="rounded-xl border border-neutral-200 bg-white p-6">
	<h2 class="font-heading text-lg font-semibold text-neutral-900">Orders</h2>

	{#if data.orders.length === 0}
		<div class="mt-8 flex flex-col items-center gap-3 py-8 text-neutral-400">
			<Package class="h-12 w-12" />
			<p class="text-sm">You haven't placed any orders yet.</p>
			<a href="/products" class="text-sm font-medium text-neutral-900 underline hover:no-underline">
				Start shopping
			</a>
		</div>
	{:else}
		<div class="mt-4 divide-y divide-neutral-100">
			{#each data.orders as order (order.id)}
				<a
					href="/account/orders/{order.id}"
					class="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-neutral-50 -mx-2 px-2 rounded-lg"
				>
					<div class="min-w-0">
						<p class="text-sm font-medium text-neutral-900">
							Order #{order.display_id}
						</p>
						<p class="mt-0.5 text-xs text-neutral-400">
							{formatDate(order.created_at)} &middot; {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
						</p>
					</div>
					<div class="flex shrink-0 items-center gap-3">
						<Badge variant={statusVariant(order.status)}>
							{order.status.replace(/_/g, ' ')}
						</Badge>
						<span class="text-sm font-medium text-neutral-900">
							{formatPrice(order.total, order.currency_code)}
						</span>
					</div>
				</a>
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
				<p class="text-xs text-neutral-400">
					Page {data.page} of {totalPages}
				</p>
				<div class="flex gap-2">
					{#if data.page > 1}
						<Button variant="outline" size="sm" href="?page={data.page - 1}">
							Previous
						</Button>
					{/if}
					{#if data.page < totalPages}
						<Button variant="outline" size="sm" href="?page={data.page + 1}">
							Next
						</Button>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</section>
