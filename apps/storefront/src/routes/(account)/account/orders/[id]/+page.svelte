<script lang="ts">
	import { Badge } from '$ui/badge';
	import { ArrowLeft } from '@lucide/svelte';
	import { formatPrice, formatDate } from '$utils/format';
	import type { Order } from '$server/medusa';

	interface Props {
		data: {
			order: Order;
		};
	}

	let { data }: Props = $props();
	let order = $derived(data.order);

	function statusVariant(status: string): 'default' | 'secondary' | 'outline' {
		switch (status) {
			case 'completed':
			case 'captured':
			case 'shipped':
			case 'delivered':
				return 'default';
			case 'pending':
			case 'requires_action':
			case 'not_fulfilled':
				return 'secondary';
			default:
				return 'outline';
		}
	}
</script>

<svelte:head>
	<title>Order #{order.display_id} — EC1</title>
</svelte:head>

<div>
	<a
		href="/account/orders"
		class="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
	>
		<ArrowLeft class="h-4 w-4" />
		Back to orders
	</a>

	<!-- Header -->
	<section class="rounded-xl border border-neutral-200 bg-white p-6">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h2 class="font-heading text-lg font-semibold text-neutral-900">
					Order #{order.display_id}
				</h2>
				<p class="mt-1 text-sm text-neutral-400">
					Placed on {formatDate(order.created_at)}
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<Badge variant={statusVariant(order.status)}>
					{order.status.replace(/_/g, ' ')}
				</Badge>
				<Badge variant={statusVariant(order.payment_status)}>
					Payment: {order.payment_status.replace(/_/g, ' ')}
				</Badge>
				<Badge variant={statusVariant(order.fulfillment_status)}>
					Fulfillment: {order.fulfillment_status.replace(/_/g, ' ')}
				</Badge>
			</div>
		</div>
	</section>

	<!-- Items -->
	<section class="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
		<h3 class="font-heading text-base font-semibold text-neutral-900">Items</h3>
		<ul class="mt-4 divide-y divide-neutral-100">
			{#each order.items as item (item.id)}
				<li class="flex gap-4 py-4">
					{#if item.thumbnail}
						<img
							src={item.thumbnail}
							alt={item.title}
							class="h-16 w-16 shrink-0 rounded-lg border border-neutral-200 object-cover"
						/>
					{:else}
						<div class="h-16 w-16 shrink-0 rounded-lg border border-neutral-200 bg-neutral-50"></div>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium text-neutral-900">
							{item.product_title ?? item.title}
						</p>
						{#if item.variant_title}
							<p class="mt-0.5 text-xs text-neutral-400">{item.variant_title}</p>
						{/if}
						<p class="mt-1 text-xs text-neutral-400">Qty: {item.quantity}</p>
					</div>
					<p class="shrink-0 text-sm font-medium text-neutral-900">
						{formatPrice(item.total, order.currency_code)}
					</p>
				</li>
			{/each}
		</ul>
	</section>

	<!-- Summary + Shipping -->
	<div class="mt-6 grid gap-6 sm:grid-cols-2">
		<!-- Shipping address -->
		{#if order.shipping_address}
			<section class="rounded-xl border border-neutral-200 bg-white p-6">
				<h3 class="font-heading text-base font-semibold text-neutral-900">Shipping Address</h3>
				<address class="mt-3 text-sm not-italic leading-relaxed text-neutral-600">
					{[order.shipping_address.first_name, order.shipping_address.last_name].filter(Boolean).join(' ')}<br />
					{#if order.shipping_address.address_1}{order.shipping_address.address_1}<br />{/if}
					{#if order.shipping_address.address_2}{order.shipping_address.address_2}<br />{/if}
					{[order.shipping_address.city, order.shipping_address.province, order.shipping_address.postal_code].filter(Boolean).join(', ')}<br />
					{#if order.shipping_address.country_code}{order.shipping_address.country_code.toUpperCase()}{/if}
				</address>
			</section>
		{/if}

		<!-- Order summary -->
		<section class="rounded-xl border border-neutral-200 bg-white p-6">
			<h3 class="font-heading text-base font-semibold text-neutral-900">Summary</h3>
			<dl class="mt-3 space-y-2 text-sm">
				<div class="flex justify-between">
					<dt class="text-neutral-500">Subtotal</dt>
					<dd class="text-neutral-900">{formatPrice(order.subtotal, order.currency_code)}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-neutral-500">Shipping</dt>
					<dd class="text-neutral-900">{formatPrice(order.shipping_total, order.currency_code)}</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-neutral-500">Tax</dt>
					<dd class="text-neutral-900">{formatPrice(order.tax_total, order.currency_code)}</dd>
				</div>
				{#if order.discount_total > 0}
					<div class="flex justify-between">
						<dt class="text-neutral-500">Discount</dt>
						<dd class="text-green-600">-{formatPrice(order.discount_total, order.currency_code)}</dd>
					</div>
				{/if}
				<div class="flex justify-between border-t border-neutral-100 pt-2 font-semibold">
					<dt class="text-neutral-900">Total</dt>
					<dd class="text-neutral-900">{formatPrice(order.total, order.currency_code)}</dd>
				</div>
			</dl>
		</section>
	</div>
</div>
