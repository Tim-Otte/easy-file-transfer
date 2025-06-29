<script lang="ts">
	import { RtcClientStatusIcon } from '$components';
	import { m } from '$messages';
	import { RTCConnectionState } from '$rtc/base-client';
	import { tooltip } from '$utils/tooltip.svelte';
	import { ChevronsLeftRightEllipsis, Router, type Icon as IconType } from '@lucide/svelte';

	type Props = {
		status: RTCConnectionState;
		p2pPing: number;
		signalingPing: number;
	};

	let { status, p2pPing, signalingPing }: Props = $props();

	const getRowColors = (status: RTCConnectionState) => {
		switch (status) {
			case RTCConnectionState.New:
			case RTCConnectionState.Disconnected:
			case RTCConnectionState.Closed:
				return 'bg-neutral-400 dark:bg-neutral-500 text-neutral-900';
			case RTCConnectionState.Connecting:
				return 'bg-yellow-600 text-neutral-900';
			case RTCConnectionState.Connected:
			case RTCConnectionState.DataChannelOpen:
				return 'bg-green-700 dark:bg-green-900 text-white';
			case RTCConnectionState.Failed:
				return 'bg-red-700 dark:bg-red-900 text-white';
			default:
				return '';
		}
	};
</script>

{#snippet pingItem(icon: typeof IconType, ping: number, hint: string)}
	{@const PingIcon = icon}

	<div
		class="flex h-6 min-w-20 cursor-default items-center justify-between rounded-sm bg-neutral-200 px-2 text-neutral-800 dark:bg-neutral-400/80 dark:text-neutral-900"
		use:tooltip={{ content: hint, allowHTML: true, placement: 'top' }}
	>
		<PingIcon class="inline size-3.5" strokeWidth="2.5" />
		<span class="font-mono">{m.ping({ ping })}</span>
	</div>
{/snippet}

<div
	class={[
		'fixed bottom-0 left-0 flex h-8 w-full flex-row items-center justify-between px-2 text-xs shadow-sm transition-colors duration-300',
		getRowColors(status)
	]}
>
	<div class="flex-1">
		<RtcClientStatusIcon {status} />
		<span class="font-[Space_Grotesk]">{m.rtc_status({ status })}</span>
	</div>
	<div
		class={['flex items-center gap-2', status !== RTCConnectionState.DataChannelOpen && 'hidden']}
	>
		{@render pingItem(ChevronsLeftRightEllipsis, p2pPing, m.p2p_ping_tooltip())}
		{@render pingItem(Router, signalingPing, m.signaling_ping_tooltip())}
	</div>
</div>
