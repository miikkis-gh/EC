<script lang="ts">
	import { enhance } from '$app/forms';
	import { Input } from '$ui/input';
	import { Label } from '$ui/label';
	import { Button } from '$ui/button';
	import { fadeInUp } from '$utils/animations';

	interface Props {
		form: {
			errors?: Record<string, string[]>;
			values?: Record<string, string>;
			success?: boolean;
		} | null;
	}

	let { form }: Props = $props();
	let headingEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (headingEl) fadeInUp(headingEl);
	});
</script>

<svelte:head>
	<title>Contact — EC1</title>
	<meta name="description" content="Get in touch with the EC1 team." />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
	<div bind:this={headingEl} class="text-center">
		<h1 class="font-heading text-4xl font-bold tracking-tight text-neutral-900">Contact Us</h1>
		<p class="mx-auto mt-4 max-w-xl text-neutral-600">
			Have a question or feedback? We'd love to hear from you.
		</p>
	</div>

	<div class="mx-auto mt-12 grid max-w-4xl gap-12 lg:grid-cols-5">
		<!-- Form -->
		<div class="lg:col-span-3">
			{#if form?.success}
				<div class="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
					<svg class="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
					</svg>
					<h2 class="mt-4 font-heading text-lg font-semibold text-green-900">Message sent!</h2>
					<p class="mt-2 text-sm text-green-700">Thank you for reaching out. We'll get back to you as soon as possible.</p>
				</div>
			{:else}
				<form method="POST" use:enhance class="space-y-6">
					{#if form?.errors?._form}
						<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							{form.errors._form[0]}
						</div>
					{/if}

					<div class="space-y-2">
						<Label for="name">Name</Label>
						<Input
							id="name"
							name="name"
							type="text"
							required
							value={form?.values?.name ?? ''}
						/>
						{#if form?.errors?.name}
							<p class="text-sm text-red-600">{form.errors.name[0]}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="email">Email</Label>
						<Input
							id="email"
							name="email"
							type="email"
							required
							value={form?.values?.email ?? ''}
						/>
						{#if form?.errors?.email}
							<p class="text-sm text-red-600">{form.errors.email[0]}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="message">Message</Label>
						<textarea
							id="message"
							name="message"
							rows="5"
							required
							class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						>{form?.values?.message ?? ''}</textarea>
						{#if form?.errors?.message}
							<p class="text-sm text-red-600">{form.errors.message[0]}</p>
						{/if}
					</div>

					<Button type="submit" class="w-full">Send Message</Button>
				</form>
			{/if}
		</div>

		<!-- Contact info sidebar -->
		<div class="lg:col-span-2">
			<div class="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
				<h2 class="font-heading text-lg font-semibold text-neutral-900">Get in Touch</h2>
				<div class="mt-4 space-y-4 text-sm text-neutral-600">
					<div class="flex items-start gap-3">
						<svg class="mt-0.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
						</svg>
						<div>
							<p class="font-medium text-neutral-900">Email</p>
							<p>hello@ec1.store</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<svg class="mt-0.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
						</svg>
						<div>
							<p class="font-medium text-neutral-900">Phone</p>
							<p>+1 (555) 123-4567</p>
						</div>
					</div>
					<div class="flex items-start gap-3">
						<svg class="mt-0.5 h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
						</svg>
						<div>
							<p class="font-medium text-neutral-900">Hours</p>
							<p>Mon–Fri: 9am–6pm CET</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
