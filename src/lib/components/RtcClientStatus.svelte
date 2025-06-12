<script lang="ts">
	import { RTCConnectionState } from '$rtc/base-client';
	import { Cable, CirclePlus, CircleX, FolderSync, Unplug, Workflow } from '@lucide/svelte';

	type Props = {
		status: RTCConnectionState;
	};

	let { status = $bindable() }: Props = $props();
</script>

<div
	class={[
		'fixed bottom-0 left-0 flex h-8 w-full flex-row items-center px-2 shadow-sm transition-colors duration-300',
		(status === RTCConnectionState.New || status === RTCConnectionState.Disconnected) &&
			'bg-zinc-500 text-zinc-900',
		status === RTCConnectionState.Connecting && 'bg-yellow-600 text-zinc-900',
		(status === RTCConnectionState.Connected || status === RTCConnectionState.DataChannelOpen) &&
			'bg-green-800 text-white',
		status === RTCConnectionState.Failed && 'bg-red-900 text-white'
	]}
>
	<div class="flex-1">
		{#if status === RTCConnectionState.New}
			<CirclePlus size="18" class="mr-0.5 inline align-sub" /> New connection
		{:else if status === RTCConnectionState.Connecting}
			<Cable size="18" class="mr-0.5 inline align-sub" /> Connecting...
		{:else if status === RTCConnectionState.Connected}
			<Workflow size="18" class="mr-0.5 inline align-sub" /> Connected
		{:else if status === RTCConnectionState.DataChannelOpen}
			<FolderSync size="18" class="mr-0.5 inline align-sub" /> Data channel open
		{:else if status === RTCConnectionState.Disconnected}
			<Unplug size="18" class="mr-0.5 inline align-sub" /> Disconnected
		{:else if status === RTCConnectionState.Failed}
			<CircleX size="18" class="mr-0.5 inline align-sub" /> Connection failed
		{/if}
	</div>
</div>
