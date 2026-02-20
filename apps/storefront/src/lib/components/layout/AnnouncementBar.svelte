<script lang="ts">
	import { browser } from '$app/environment';

	interface Props {
		message: string;
		link?: { href: string; label: string };
		dismissible?: boolean;
	}

	let { message, link, dismissible = true }: Props = $props();

	const storageKey = $derived(`announcement-dismissed:${message}`);
	let dismissed = $state(false);

	$effect(() => {
		if (browser) {
			dismissed = localStorage.getItem(storageKey) === '1';
		}
	});

	function dismiss() {
		dismissed = true;
		if (browser) {
			localStorage.setItem(storageKey, '1');
		}
	}
</script>

{#if !dismissed}
	<div class="bg-primary-600 py-2 text-center text-sm text-white">
		<div class="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4">
			<p>
				{message}
				{#if link}
					<a href={link.href} class="ml-1 font-medium underline underline-offset-2 hover:no-underline">
						{link.label}
					</a>
				{/if}
			</p>
			{#if dismissible}
				<button
					onclick={dismiss}
					class="ml-2 rounded p-0.5 hover:bg-primary-700"
					aria-label="Dismiss announcement"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>
	</div>
{/if}
