<script lang="ts">
	import { Signal, SignalHigh, SignalLow, SignalMedium, type IconProps } from '@lucide/svelte';

	type Props = {
		ping: number;
	};

	let { ping }: Props = $props();

	let iconParams: IconProps = {
		size: 16,
		class: 'mr-0.5 inline align-text-bottom'
	};
</script>

{#if ping < 5}
	<Signal {...iconParams} />
{:else if ping < 10}
	<SignalHigh {...iconParams} />
{:else if ping < 20}
	<SignalMedium {...iconParams} />
{:else}
	<SignalLow {...iconParams} />
{/if}
