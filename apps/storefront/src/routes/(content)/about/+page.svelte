<script lang="ts">
	import { fadeInUp } from '$utils/animations';

	let heroEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (heroEl) fadeInUp(heroEl);
	});

	const values = [
		{
			title: 'Quality First',
			description: 'Every product in our collection is carefully selected to meet the highest standards of craftsmanship and durability.',
			icon: 'M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z'
		},
		{
			title: 'Sustainable Approach',
			description: 'We partner with brands that share our commitment to ethical sourcing and environmentally responsible practices.',
			icon: 'M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418'
		},
		{
			title: 'Customer Focused',
			description: 'Your satisfaction is our priority. We offer hassle-free returns, responsive support, and a seamless shopping experience.',
			icon: 'M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z'
		}
	];
</script>

<svelte:head>
	<title>About — EC1</title>
	<meta name="description" content="Learn about EC1 — our story, values, and commitment to quality." />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
	<!-- Hero -->
	<div bind:this={heroEl} class="text-center">
		<h1 class="font-heading text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
			About EC1
		</h1>
		<p class="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
			We believe great products should be accessible to everyone. EC1 is a curated marketplace where quality meets affordability.
		</p>
	</div>

	<!-- Our Story -->
	<div class="mx-auto mt-16 max-w-3xl">
		<h2 class="font-heading text-2xl font-bold text-neutral-900">Our Story</h2>
		<div class="mt-4 space-y-4 text-neutral-600">
			<p>
				EC1 started with a simple idea: shopping online should feel as personal and curated as visiting your favorite local boutique. We were tired of endless scrolling through mediocre products, so we built something different.
			</p>
			<p>
				Every product you see on EC1 has been hand-picked by our team. We work directly with independent makers, emerging brands, and established artisans who share our passion for quality and design. The result is a collection that feels intentional — not overwhelming.
			</p>
			<p>
				Based in Europe and shipping worldwide, we're proud to connect customers with products they'll love for years to come.
			</p>
		</div>
	</div>

	<!-- Values -->
	<div class="mt-20">
		<h2 class="text-center font-heading text-2xl font-bold text-neutral-900">What We Stand For</h2>
		<div class="mt-10 grid gap-8 md:grid-cols-3">
			{#each values as value (value.title)}
				<div class="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
					<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
						<svg class="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d={value.icon} />
						</svg>
					</div>
					<h3 class="mt-4 font-heading text-lg font-semibold text-neutral-900">{value.title}</h3>
					<p class="mt-2 text-sm text-neutral-600">{value.description}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Team placeholder -->
	<div class="mt-20 text-center">
		<h2 class="font-heading text-2xl font-bold text-neutral-900">Our Team</h2>
		<p class="mx-auto mt-4 max-w-2xl text-neutral-600">
			We're a small, passionate team of product enthusiasts, designers, and engineers building the future of curated commerce.
		</p>
		<div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
			{#each ['Founder & CEO', 'Head of Product', 'Lead Designer', 'Engineering Lead'] as role}
				<div class="rounded-xl border border-neutral-200 bg-white p-6">
					<div class="mx-auto h-20 w-20 rounded-full bg-neutral-100"></div>
					<p class="mt-4 text-sm font-medium text-neutral-900">Team Member</p>
					<p class="text-xs text-neutral-500">{role}</p>
				</div>
			{/each}
		</div>
	</div>
</div>
