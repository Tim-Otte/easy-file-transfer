<script lang="ts">
	import { RTCConnectionState } from '$rtc/base-client';
	import { Cable, CircleX, FolderSync, Unplug, Workflow, type IconProps } from '@lucide/svelte';

	type Props = {
		status: RTCConnectionState;
	};

	let { status = $bindable() }: Props = $props();

	let iconParams: IconProps = {
		size: 16,
		class: 'mr-0.5 inline align-text-bottom'
	};
</script>

{#if status === RTCConnectionState.New || status === RTCConnectionState.Disconnected || status === RTCConnectionState.Closed}
	<Unplug {...iconParams} />
{:else if status === RTCConnectionState.Connecting}
	<Cable {...iconParams} />
{:else if status === RTCConnectionState.Connected}
	<Workflow {...iconParams} />
{:else if status === RTCConnectionState.DataChannelOpen}
	<FolderSync {...iconParams} />
{:else if status === RTCConnectionState.Failed}
	<CircleX {...iconParams} />
{/if}
