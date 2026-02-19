<script lang="ts">
	import { onMount } from 'svelte';
	import { getStripe } from '$utils/stripe';
	import { Button } from '$ui/button';

	interface Props {
		clientSecret: string;
		returnUrl: string;
		onError: (message: string) => void;
	}

	let { clientSecret, returnUrl, onError }: Props = $props();

	let stripe: Awaited<ReturnType<typeof getStripe>>;
	let elements: ReturnType<NonNullable<typeof stripe>['elements']> | undefined;
	let paymentElement: HTMLDivElement;
	let processing = $state(false);
	let ready = $state(false);

	onMount(async () => {
		stripe = await getStripe();
		if (!stripe) {
			onError('Failed to load Stripe');
			return;
		}

		elements = stripe.elements({
			clientSecret,
			appearance: {
				theme: 'stripe',
				variables: {
					colorPrimary: '#3b3b7a',
					colorBackground: '#ffffff',
					borderRadius: '12px',
					fontFamily: 'Inter Variable, system-ui, sans-serif'
				}
			}
		});

		const payment = elements.create('payment');
		payment.mount(paymentElement);
		payment.on('ready', () => {
			ready = true;
		});
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!stripe || !elements || processing) return;

		processing = true;

		const { error } = await stripe.confirmPayment({
			elements,
			confirmParams: {
				return_url: returnUrl
			}
		});

		if (error) {
			onError(error.message || 'Payment failed');
			processing = false;
		}
	}
</script>

<form onsubmit={handleSubmit}>
	<div bind:this={paymentElement} class="min-h-[120px]"></div>

	<Button
		type="submit"
		class="mt-6 w-full"
		disabled={processing || !ready}
	>
		{processing ? 'Processing...' : 'Pay now'}
	</Button>
</form>
