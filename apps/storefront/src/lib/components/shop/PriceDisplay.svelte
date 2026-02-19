<script lang="ts">
	import { formatPrice } from '$utils/format';

	interface Props {
		amount: number;
		currencyCode?: string;
		class?: string;
	}

	let { amount, currencyCode = 'eur', class: className = '' }: Props = $props();
</script>

<span class={className}>
	{formatPrice(amount, currencyCode)}
</span>
