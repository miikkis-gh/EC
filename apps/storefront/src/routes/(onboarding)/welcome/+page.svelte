<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$ui/button';
	import { Input } from '$ui/input';
	import { Label } from '$ui/label';
	import { cn } from '$utils';
	import { stepTransition, celebrationReveal } from '$utils/animations';
	import { Truck, ShieldCheck, Clock, Check, ShoppingBag, User } from '@lucide/svelte';
	import { onMount, tick } from 'svelte';
	import gsap from 'gsap';

	interface Props {
		data: {
			user: { id: string; email: string };
			customer: {
				first_name: string | null;
				last_name: string | null;
				phone: string | null;
				addresses?: { id: string }[];
			} | null;
			customerName: string | null;
			resumeStep: number;
		};
		form: {
			action?: 'updateProfile' | 'addAddress';
			success?: boolean;
			error?: string;
		} | null;
	}

	let { data, form }: Props = $props();

	const TOTAL_STEPS = 4;
	let currentStep = $state(data.resumeStep);
	let profileSaved = $state(data.resumeStep >= 2);
	let addressSaved = $state(data.resumeStep >= 3);
	let submitting = $state(false);

	// Refs for step containers
	let stepContainer: HTMLDivElement;
	let progressBar: HTMLDivElement;

	// Handle form action results
	$effect(() => {
		if (form?.success && form.action === 'updateProfile') {
			profileSaved = true;
			submitting = false;
			goToStep(2);
		}
		if (form?.success && form.action === 'addAddress') {
			addressSaved = true;
			submitting = false;
			goToStep(3);
		}
		if (form?.error) {
			submitting = false;
		}
	});

	function getStepEl(step: number): Element | null {
		return stepContainer?.querySelector(`[data-step="${step}"]`) ?? null;
	}

	async function goToStep(next: number) {
		const outEl = getStepEl(currentStep);
		currentStep = next;
		await tick();
		const inEl = getStepEl(next);

		// Animate progress bar
		if (progressBar) {
			gsap.to(progressBar, {
				width: `${(next / (TOTAL_STEPS - 1)) * 100}%`,
				duration: 0.4,
				ease: 'power2.out'
			});
		}

		if (outEl && inEl) {
			stepTransition(outEl, inEl);
		} else if (inEl) {
			gsap.fromTo(inEl, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
		}

		// Celebration animation on final step
		if (next === 3) {
			await tick();
			const completionEl = getStepEl(3);
			if (completionEl) {
				celebrationReveal(completionEl);
			}
		}

		// Focus management
		await tick();
		const newStepEl = getStepEl(next);
		const heading = newStepEl?.querySelector('h1, h2');
		if (heading instanceof HTMLElement) {
			heading.focus();
		}
	}

	onMount(() => {
		const firstStep = getStepEl(currentStep);
		if (firstStep) {
			gsap.fromTo(firstStep, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
		}
	});

	const greeting = $derived(
		data.customerName ? `Welcome to EC1, ${data.customerName}!` : 'Welcome to EC1!'
	);
</script>

<svelte:head>
	<title>Welcome — EC1</title>
</svelte:head>

<div class="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
	<!-- Progress bar -->
	<div class="mb-10" role="progressbar" aria-valuenow={currentStep} aria-valuemin={0} aria-valuemax={TOTAL_STEPS - 1} aria-label="Onboarding progress">
		<div class="h-1.5 w-full rounded-full bg-neutral-100">
			<div
				bind:this={progressBar}
				class="h-1.5 rounded-full bg-primary-500 transition-none"
				style="width: {(currentStep / (TOTAL_STEPS - 1)) * 100}%"
			></div>
		</div>
		<p class="mt-2 text-xs text-neutral-400 text-right">Step {Math.min(currentStep + 1, TOTAL_STEPS - 1)} of {TOTAL_STEPS - 1}</p>
	</div>

	<!-- Step container -->
	<div bind:this={stepContainer} aria-live="polite">
		<!-- Step 0: Welcome -->
		{#if currentStep === 0}
			<div data-step="0">
				<div class="text-center">
					<!-- Animated checkmark -->
					<div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
						<svg class="h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 6 9 17l-5-5">
								<animate attributeName="stroke-dasharray" from="0 30" to="30 0" dur="0.6s" fill="freeze" />
							</path>
						</svg>
					</div>

					<h1 class="font-heading text-2xl font-bold text-neutral-900" tabindex="-1">{greeting}</h1>
					<p class="mt-2 text-sm text-neutral-500">Your account is ready. Let's set up your profile and shipping address to get started.</p>
				</div>

				<!-- Feature highlights -->
				<div class="mt-8 space-y-4">
					<div class="flex items-start gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
						<Truck class="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
						<div>
							<p class="text-sm font-medium text-neutral-900">Fast shipping</p>
							<p class="text-xs text-neutral-500">Save your address for quicker checkout</p>
						</div>
					</div>
					<div class="flex items-start gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
						<Clock class="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
						<div>
							<p class="text-sm font-medium text-neutral-900">Order tracking</p>
							<p class="text-xs text-neutral-500">Follow your orders from purchase to delivery</p>
						</div>
					</div>
					<div class="flex items-start gap-3 rounded-lg border border-neutral-100 bg-neutral-50 p-4">
						<ShieldCheck class="mt-0.5 h-5 w-5 shrink-0 text-primary-500" />
						<div>
							<p class="text-sm font-medium text-neutral-900">Secure account</p>
							<p class="text-xs text-neutral-500">Your data is protected with modern security</p>
						</div>
					</div>
				</div>

				<div class="mt-8">
					<Button class="w-full" onclick={() => goToStep(1)}>Let's get started</Button>
				</div>
			</div>
		{/if}

		<!-- Step 1: Profile -->
		{#if currentStep === 1}
			<div data-step="1">
				<div class="text-center">
					<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
						<User class="h-6 w-6 text-primary-500" />
					</div>
					<h2 class="font-heading text-xl font-bold text-neutral-900" tabindex="-1">Complete your profile</h2>
					<p class="mt-1 text-sm text-neutral-500">Help us personalize your experience</p>
				</div>

				<form
					method="POST"
					action="?/updateProfile"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
						};
					}}
					class="mt-6 space-y-4"
				>
					{#if form?.error && form.action === 'updateProfile'}
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
								required
								value={data.customer?.first_name ?? ''}
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
								value={data.customer?.last_name ?? ''}
							/>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="phone">Phone <span class="font-normal text-neutral-400">(optional)</span></Label>
						<Input
							id="phone"
							name="phone"
							type="tel"
							autocomplete="tel"
							placeholder="+358 40 123 4567"
							value={data.customer?.phone ?? ''}
						/>
						<p class="text-xs text-neutral-400">Helps with delivery coordination</p>
					</div>

					<div class="flex gap-3 pt-2">
						<Button type="submit" class="flex-1" disabled={submitting}>
							{submitting ? 'Saving...' : 'Save & continue'}
						</Button>
					</div>
				</form>
			</div>
		{/if}

		<!-- Step 2: Address -->
		{#if currentStep === 2}
			<div data-step="2">
				<div class="text-center">
					<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
						<Truck class="h-6 w-6 text-primary-500" />
					</div>
					<h2 class="font-heading text-xl font-bold text-neutral-900" tabindex="-1">Add a shipping address</h2>
					<p class="mt-1 text-sm text-neutral-500">Save time at checkout</p>
				</div>

				<form
					method="POST"
					action="?/addAddress"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							await update();
						};
					}}
					class="mt-6 space-y-4"
				>
					{#if form?.error && form.action === 'addAddress'}
						<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{form.error}
						</div>
					{/if}

					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="addr_first_name">First name</Label>
							<Input
								id="addr_first_name"
								name="first_name"
								type="text"
								autocomplete="given-name"
								required
								value={data.customer?.first_name ?? ''}
							/>
						</div>
						<div class="space-y-2">
							<Label for="addr_last_name">Last name</Label>
							<Input
								id="addr_last_name"
								name="last_name"
								type="text"
								autocomplete="family-name"
								required
								value={data.customer?.last_name ?? ''}
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
						/>
					</div>

					<div class="space-y-2">
						<Label for="address_2">Apartment, suite, etc. <span class="font-normal text-neutral-400">(optional)</span></Label>
						<Input
							id="address_2"
							name="address_2"
							type="text"
							autocomplete="address-line2"
						/>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="city">City</Label>
							<Input id="city" name="city" type="text" autocomplete="address-level2" required />
						</div>
						<div class="space-y-2">
							<Label for="postal_code">Postal code</Label>
							<Input id="postal_code" name="postal_code" type="text" autocomplete="postal-code" required />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="province">Province <span class="font-normal text-neutral-400">(optional)</span></Label>
							<Input id="province" name="province" type="text" autocomplete="address-level1" />
						</div>
						<div class="space-y-2">
							<Label for="country_code">Country code</Label>
							<Input
								id="country_code"
								name="country_code"
								type="text"
								autocomplete="country"
								required
								maxlength={2}
								placeholder="FI"
							/>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="addr_phone">Phone <span class="font-normal text-neutral-400">(optional)</span></Label>
						<Input
							id="addr_phone"
							name="phone"
							type="tel"
							autocomplete="tel"
						/>
					</div>

					<div class="flex gap-3 pt-2">
						<Button type="submit" class="flex-1" disabled={submitting}>
							{submitting ? 'Saving...' : 'Save address'}
						</Button>
					</div>
				</form>
			</div>
		{/if}

		<!-- Step 3: Completion -->
		{#if currentStep === 3}
			<div data-step="3">
				<div class="text-center">
					<!-- Celebration icon -->
					<div data-reveal class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
						<svg class="h-8 w-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 6 9 17l-5-5" />
						</svg>
					</div>

					<h2 data-reveal class="font-heading text-2xl font-bold text-neutral-900" tabindex="-1">You're all set!</h2>
					<p data-reveal class="mt-2 text-sm text-neutral-500">Your account is ready to go. Here's what you've set up:</p>
				</div>

				<!-- Summary -->
				<div data-reveal class="mt-8 space-y-3">
					<div class={cn(
						'flex items-center gap-3 rounded-lg border p-4',
						profileSaved
							? 'border-green-200 bg-green-50'
							: 'border-neutral-100 bg-neutral-50'
					)}>
						{#if profileSaved}
							<Check class="h-5 w-5 shrink-0 text-green-500" />
						{:else}
							<div class="h-5 w-5 shrink-0 rounded-full border-2 border-neutral-300"></div>
						{/if}
						<span class="text-sm text-neutral-700">Profile information</span>
					</div>

					<div class={cn(
						'flex items-center gap-3 rounded-lg border p-4',
						addressSaved
							? 'border-green-200 bg-green-50'
							: 'border-neutral-100 bg-neutral-50'
					)}>
						{#if addressSaved}
							<Check class="h-5 w-5 shrink-0 text-green-500" />
						{:else}
							<div class="h-5 w-5 shrink-0 rounded-full border-2 border-neutral-300"></div>
						{/if}
						<span class="text-sm text-neutral-700">Shipping address</span>
					</div>
				</div>

				<!-- CTAs -->
				<div data-reveal class="mt-8 space-y-3">
					<form method="POST" action="?/completeOnboarding" use:enhance>
						<Button type="submit" class="w-full">
							<ShoppingBag class="h-4 w-4" />
							Start shopping
						</Button>
					</form>
				</div>
			</div>
		{/if}
	</div>
</div>
