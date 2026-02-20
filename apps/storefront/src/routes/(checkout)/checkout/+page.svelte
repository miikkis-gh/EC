<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { Button } from '$ui/button';
	import { Input } from '$ui/input';
	import { Label } from '$ui/label';
	import { Separator } from '$ui/separator';
	import PriceDisplay from '$components/shop/PriceDisplay.svelte';
	import PaymentForm from '$components/shop/PaymentForm.svelte';
	import CheckoutSteps from '$components/shop/CheckoutSteps.svelte';
	import { env } from '$env/dynamic/public';
	import type { Cart, ShippingOption } from '$server/medusa';

	interface Props {
		data: { cart: Cart };
	}

	let { data }: Props = $props();
	let cart = $derived(data.cart);

	// Step management: 'shipping' | 'payment'
	let step = $state<'shipping' | 'payment'>('shipping');

	// Shipping form state
	let email = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let address1 = $state('');
	let city = $state('');
	let countryCode = $state('us');
	let postalCode = $state('');
	let phone = $state('');

	// Hydrate form fields from server data on mount
	$effect(() => {
		const c = data.cart;
		if (!email && c.email) email = c.email;
		if (!firstName && c.shipping_address?.first_name) firstName = c.shipping_address.first_name;
		if (!lastName && c.shipping_address?.last_name) lastName = c.shipping_address.last_name;
		if (!address1 && c.shipping_address?.address_1) address1 = c.shipping_address.address_1;
		if (!city && c.shipping_address?.city) city = c.shipping_address.city;
		if (countryCode === 'us' && c.shipping_address?.country_code) countryCode = c.shipping_address.country_code;
		if (!postalCode && c.shipping_address?.postal_code) postalCode = c.shipping_address.postal_code;
		if (!phone && c.shipping_address?.phone) phone = c.shipping_address.phone;
	});

	let shippingOptions = $state<ShippingOption[]>([]);
	let selectedShipping = $state('');
	let shippingError = $state('');
	let shippingLoading = $state(false);

	// Payment state
	let clientSecret = $state('');
	let paymentError = $state('');
	let paymentLoading = $state(false);

	async function submitShipping() {
		shippingError = '';
		shippingLoading = true;

		try {
			// Save address + email on cart
			const addrRes = await fetch('/api/checkout/shipping-address', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					address: {
						first_name: firstName,
						last_name: lastName,
						address_1: address1,
						city,
						country_code: countryCode,
						postal_code: postalCode,
						phone: phone || undefined
					}
				})
			});

			if (!addrRes.ok) {
				const err = await addrRes.json();
				throw new Error(err.error || 'Failed to save address');
			}

			// Get shipping options
			const optRes = await fetch('/api/checkout/shipping-options');
			if (!optRes.ok) throw new Error('Failed to load shipping options');

			const optData = await optRes.json();
			shippingOptions = optData.shipping_options || [];

			// Auto-select first option if available
			if (shippingOptions.length > 0 && !selectedShipping) {
				selectedShipping = shippingOptions[0].id;
			}

			// Select shipping method
			if (selectedShipping) {
				const shipRes = await fetch('/api/checkout/shipping-options', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ option_id: selectedShipping })
				});
				if (!shipRes.ok) throw new Error('Failed to set shipping method');
			}

			// Init payment session with Stripe
			paymentLoading = true;
			const payRes = await fetch('/api/checkout/payment', { method: 'POST' });
			if (!payRes.ok) {
				const err = await payRes.json();
				throw new Error(err.error || 'Failed to initialize payment');
			}

			const payData = await payRes.json();
			clientSecret = payData.clientSecret;

			await invalidateAll();
			step = 'payment';
		} catch (err) {
			shippingError = err instanceof Error ? err.message : 'Something went wrong';
		} finally {
			shippingLoading = false;
			paymentLoading = false;
		}
	}

	function handlePaymentError(message: string) {
		paymentError = message;
	}

	function backToShipping() {
		step = 'shipping';
		paymentError = '';
	}

	const returnUrl = $derived(
		`${env.PUBLIC_STORE_URL || 'http://localhost:5173'}/checkout/complete`
	);
</script>

<svelte:head>
	<title>Checkout — EC1</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
	<h1 class="mb-8 font-heading text-3xl font-bold text-neutral-900">Checkout</h1>

	<!-- Steps indicator -->
	<CheckoutSteps
		steps={[
			{ key: 'shipping', label: 'Shipping' },
			{ key: 'payment', label: 'Payment' }
		]}
		currentStep={step}
	/>

	<div class="grid gap-8 lg:grid-cols-5">
		<!-- Main form area -->
		<div class="lg:col-span-3">
			{#if step === 'shipping'}
				<!-- Shipping form -->
				<form
					onsubmit={(e) => { e.preventDefault(); submitShipping(); }}
					class="space-y-6"
				>
					<div class="rounded-xl border border-neutral-200 bg-white p-6">
						<h2 class="font-heading text-lg font-semibold text-neutral-900">Contact</h2>
						<div class="mt-4 space-y-2">
							<Label for="email">Email</Label>
							<Input
								id="email"
								name="email"
								type="email"
								autocomplete="email"
								required
								bind:value={email}
							/>
						</div>
					</div>

					<div class="rounded-xl border border-neutral-200 bg-white p-6">
						<h2 class="font-heading text-lg font-semibold text-neutral-900">Shipping address</h2>
						<div class="mt-4 space-y-4">
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-2">
									<Label for="first_name">First name</Label>
									<Input
										id="first_name"
										name="first_name"
										type="text"
										autocomplete="given-name"
										required
										bind:value={firstName}
									/>
								</div>
								<div class="space-y-2">
									<Label for="last_name">Last name</Label>
									<Input
										id="last_name"
										name="last_name"
										type="text"
										autocomplete="family-name"
										required
										bind:value={lastName}
									/>
								</div>
							</div>

							<div class="space-y-2">
								<Label for="address_1">Address</Label>
								<Input
									id="address_1"
									name="address_1"
									type="text"
									autocomplete="address-line1"
									required
									bind:value={address1}
								/>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-2">
									<Label for="city">City</Label>
									<Input
										id="city"
										name="city"
										type="text"
										autocomplete="address-level2"
										required
										bind:value={city}
									/>
								</div>
								<div class="space-y-2">
									<Label for="postal_code">Postal code</Label>
									<Input
										id="postal_code"
										name="postal_code"
										type="text"
										autocomplete="postal-code"
										required
										bind:value={postalCode}
									/>
								</div>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-2">
									<Label for="country_code">Country</Label>
									<select
										id="country_code"
										name="country_code"
										autocomplete="country"
										required
										bind:value={countryCode}
										class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									>
										<option value="us">United States</option>
										<option value="gb">United Kingdom</option>
										<option value="de">Germany</option>
										<option value="fr">France</option>
										<option value="ca">Canada</option>
										<option value="au">Australia</option>
									</select>
								</div>
								<div class="space-y-2">
									<Label for="phone">Phone (optional)</Label>
									<Input
										id="phone"
										name="phone"
										type="tel"
										autocomplete="tel"
										bind:value={phone}
									/>
								</div>
							</div>
						</div>
					</div>

					{#if shippingError}
						<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{shippingError}
						</div>
					{/if}

					<Button type="submit" class="w-full" disabled={shippingLoading}>
						{shippingLoading ? 'Loading...' : 'Continue to payment'}
					</Button>
				</form>
			{:else if step === 'payment'}
				<!-- Payment step -->
				<div class="space-y-6">
					<!-- Shipping summary -->
					<div class="rounded-xl border border-neutral-200 bg-white p-6">
						<div class="flex items-center justify-between">
							<h2 class="font-heading text-lg font-semibold text-neutral-900">Shipping</h2>
							<button
								onclick={backToShipping}
								class="text-sm font-medium text-primary-600 hover:text-primary-700"
							>
								Edit
							</button>
						</div>
						<div class="mt-3 text-sm text-neutral-600">
							<p>{firstName} {lastName}</p>
							<p>{address1}</p>
							<p>{city}, {postalCode}, {countryCode.toUpperCase()}</p>
							<p class="mt-1 text-neutral-400">{email}</p>
						</div>
					</div>

					<!-- Payment form -->
					<div class="rounded-xl border border-neutral-200 bg-white p-6">
						<h2 class="mb-4 font-heading text-lg font-semibold text-neutral-900">Payment</h2>

						{#if paymentError}
							<div class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
								{paymentError}
							</div>
						{/if}

						{#if clientSecret}
							<PaymentForm
								{clientSecret}
								{returnUrl}
								onError={handlePaymentError}
							/>
						{:else}
							<p class="text-sm text-neutral-500">Loading payment form...</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Order summary sidebar -->
		<div class="lg:col-span-2">
			<div class="sticky top-24 rounded-xl border border-neutral-200 bg-white p-6">
				<h2 class="font-heading text-lg font-semibold text-neutral-900">Order summary</h2>

				<!-- Items -->
				<div class="mt-4 space-y-3">
					{#each cart.items as item (item.id)}
						<div class="flex items-start gap-3">
							<div class="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
								{#if item.thumbnail}
									<img src={item.thumbnail} alt={item.title} class="h-full w-full object-cover" />
								{/if}
								<span class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-600 text-[10px] font-bold text-white">
									{item.quantity}
								</span>
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium text-neutral-900">{item.title}</p>
								{#if item.description}
									<p class="text-xs text-neutral-400">{item.description}</p>
								{/if}
							</div>
							<PriceDisplay
								amount={item.total}
								currencyCode={cart.currency_code}
								class="text-sm font-medium text-neutral-900"
							/>
						</div>
					{/each}
				</div>

				<Separator class="my-4" />

				<!-- Totals -->
				<div class="space-y-2">
					<div class="flex justify-between text-sm">
						<span class="text-neutral-600">Subtotal</span>
						<PriceDisplay amount={cart.subtotal ?? 0} currencyCode={cart.currency_code} class="text-neutral-900" />
					</div>
					<div class="flex justify-between text-sm">
						<span class="text-neutral-600">Shipping</span>
						{#if cart.shipping_total}
							<PriceDisplay amount={cart.shipping_total} currencyCode={cart.currency_code} class="text-neutral-900" />
						{:else}
							<span class="text-neutral-400">Calculated next</span>
						{/if}
					</div>
					{#if cart.tax_total}
						<div class="flex justify-between text-sm">
							<span class="text-neutral-600">Tax</span>
							<PriceDisplay amount={cart.tax_total} currencyCode={cart.currency_code} class="text-neutral-900" />
						</div>
					{/if}
					{#if cart.discount_total}
						<div class="flex justify-between text-sm">
							<span class="text-neutral-600">Discount</span>
							<span class="text-green-600">-<PriceDisplay amount={cart.discount_total} currencyCode={cart.currency_code} /></span>
						</div>
					{/if}
				</div>

				<Separator class="my-4" />

				<div class="flex justify-between">
					<span class="text-base font-semibold text-neutral-900">Total</span>
					<PriceDisplay amount={cart.total ?? 0} currencyCode={cart.currency_code} class="text-base font-semibold text-neutral-900" />
				</div>
			</div>
		</div>
	</div>
</div>
