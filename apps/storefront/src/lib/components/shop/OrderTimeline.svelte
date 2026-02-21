<script lang="ts">
	import { formatDate } from '$utils/format';
	import type { Order } from '$server/medusa';

	interface Props {
		order: Order;
	}

	let { order }: Props = $props();

	const hasFulfillment = $derived((order.fulfillments?.length ?? 0) > 0);
	const trackingLink = $derived(order.fulfillments?.[0]?.tracking_links?.[0] ?? null);

	interface TimelineStep {
		label: string;
		completed: boolean;
		date?: string;
		detail?: string;
	}

	const steps = $derived((): TimelineStep[] => {
		const isPaymentCaptured = order.payment_status === 'captured';
		const isShipped = order.fulfillment_status === 'shipped' || order.fulfillment_status === 'delivered';
		const isDelivered = order.fulfillment_status === 'delivered';

		return [
			{
				label: 'Order Placed',
				completed: true,
				date: order.created_at
			},
			{
				label: 'Payment Confirmed',
				completed: isPaymentCaptured,
			},
			{
				label: 'Processing',
				completed: hasFulfillment,
			},
			{
				label: 'Shipped',
				completed: isShipped,
				detail: trackingLink ? trackingLink.tracking_number : undefined,
				date: hasFulfillment ? order.fulfillments![0].created_at : undefined
			},
			{
				label: 'Delivered',
				completed: isDelivered,
			}
		];
	});

	function getActiveIndex(stepsList: TimelineStep[]): number {
		let lastCompleted = -1;
		for (let i = 0; i < stepsList.length; i++) {
			if (stepsList[i].completed) lastCompleted = i;
		}
		return Math.min(lastCompleted + 1, stepsList.length - 1);
	}
</script>

<section class="rounded-xl border border-neutral-200 bg-white p-6">
	<h3 class="font-heading text-base font-semibold text-neutral-900">Order Progress</h3>

	<div class="mt-6 space-y-0">
		{#each steps() as step, i}
			{@const activeIndex = getActiveIndex(steps())}
			{@const isActive = i === activeIndex && !step.completed}
			{@const isLast = i === steps().length - 1}
			<div class="flex gap-3">
				<!-- Timeline indicator -->
				<div class="flex flex-col items-center">
					{#if step.completed}
						<div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600">
							<svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
							</svg>
						</div>
					{:else if isActive}
						<div class="relative flex h-6 w-6 items-center justify-center">
							<div class="absolute h-6 w-6 animate-ping rounded-full bg-primary-200"></div>
							<div class="relative h-3 w-3 rounded-full bg-primary-600"></div>
						</div>
					{:else}
						<div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-neutral-200">
							<div class="h-2 w-2 rounded-full bg-neutral-200"></div>
						</div>
					{/if}
					{#if !isLast}
						<div class="w-0.5 flex-1 min-h-6 {step.completed ? 'bg-primary-600' : 'bg-neutral-200'}"></div>
					{/if}
				</div>

				<!-- Content -->
				<div class="pb-6 {isLast ? 'pb-0' : ''}">
					<p class="text-sm font-medium {step.completed || isActive ? 'text-neutral-900' : 'text-neutral-400'}">
						{step.label}
					</p>
					{#if step.date}
						<p class="mt-0.5 text-xs text-neutral-400">{formatDate(step.date)}</p>
					{/if}
					{#if step.label === 'Shipped' && trackingLink}
						<a
							href={trackingLink.url}
							target="_blank"
							rel="noopener noreferrer"
							class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
						>
							Track: {trackingLink.tracking_number}
							<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
							</svg>
						</a>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</section>
