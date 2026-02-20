<script lang="ts">
	import { cn } from '$utils';

	interface Props {
		steps: { key: string; label: string }[];
		currentStep: string;
		class?: string;
	}

	let { steps, currentStep, class: className }: Props = $props();

	const currentIndex = $derived(steps.findIndex((s) => s.key === currentStep));

	function stepState(index: number): 'completed' | 'current' | 'upcoming' {
		if (index < currentIndex) return 'completed';
		if (index === currentIndex) return 'current';
		return 'upcoming';
	}
</script>

<div class={cn('mb-8', className)}>
	<ol class="flex items-center">
		{#each steps as step, i (step.key)}
			{@const state = stepState(i)}
			{#if i > 0}
				<!-- Connecting line -->
				<li class="flex-1" aria-hidden="true">
					<div class={cn('mx-2 h-0.5 rounded-full', state === 'upcoming' ? 'bg-neutral-200' : 'bg-primary-600')}></div>
				</li>
			{/if}
			<li class="flex items-center gap-2">
				{#if state === 'completed'}
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600">
						<svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
						</svg>
					</div>
				{:else if state === 'current'}
					<div class="flex h-8 w-8 items-center justify-center rounded-full ring-2 ring-primary-600">
						<div class="h-2.5 w-2.5 rounded-full bg-primary-600"></div>
					</div>
				{:else}
					<div class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200">
						<span class="text-xs font-medium text-neutral-500">{i + 1}</span>
					</div>
				{/if}
				<span class={cn('text-sm font-medium', state === 'upcoming' ? 'text-neutral-400' : 'text-neutral-900')}>
					{step.label}
				</span>
			</li>
		{/each}
	</ol>
</div>
