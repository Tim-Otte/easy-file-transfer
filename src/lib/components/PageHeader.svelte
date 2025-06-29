<script lang="ts">
	import { RTCConnectionState } from '$rtc/base-client';
	import { Send } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		status: RTCConnectionState;
		children?: Snippet;
	};

	let { status = $bindable(), children }: Props = $props();
</script>

<div class="mb-5 flex flex-row items-center justify-between font-[Space_Grotesk]">
	<h1 class="text-2xl font-bold">
		<Send
			size="35"
			strokeWidth="1.5"
			class={[
				'mr-3 inline align-text-bottom drop-shadow-xs transition-colors duration-300',
				status === RTCConnectionState.DataChannelOpen
					? 'text-green-700 drop-shadow-green-600 dark:drop-shadow-green-800'
					: 'text-blue-600 drop-shadow-blue-500 dark:drop-shadow-blue-700'
			]}
		/>
		<span class="hidden sm:inline">Easy file transfer</span>
	</h1>
	{#if children}
		{@render children()}
	{/if}
</div>
