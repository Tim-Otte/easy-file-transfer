<script lang="ts">
	import { m } from '$messages';
	import { RTCConnectionState } from '$rtc/base-client';
	import { RtcClientStatusIcon } from '$components';
	import RtcClientStatusPingIcon from './RtcClientStatusPingIcon.svelte';

	type Props = {
		status: RTCConnectionState;
		ping: number;
	};

	let { status = $bindable(), ping }: Props = $props();

	const getRowColors = (status: RTCConnectionState) => {
		switch (status) {
			case RTCConnectionState.New:
			case RTCConnectionState.Disconnected:
			case RTCConnectionState.Closed:
				return 'bg-zinc-500 text-zinc-900';
			case RTCConnectionState.Connecting:
				return 'bg-yellow-600 text-zinc-900';
			case RTCConnectionState.Connected:
			case RTCConnectionState.DataChannelOpen:
				return 'bg-green-900 text-white';
			case RTCConnectionState.Failed:
				return 'bg-red-900 text-white';
			default:
				return '';
		}
	};
</script>

<div
	class={[
		'fixed bottom-0 left-0 flex h-8 w-full flex-row items-center justify-between px-2 text-sm shadow-sm transition-colors duration-300',
		getRowColors(status)
	]}
>
	<div class="flex-1">
		<RtcClientStatusIcon {status} />
		<span class="font-[Space_Grotesk]">{m.rtc_status({ status })}</span>
	</div>
	<div class={[status !== RTCConnectionState.DataChannelOpen && 'hidden']}>
		<RtcClientStatusPingIcon {ping} /> <span class="font-[Space_Grotesk]">{m.ping({ ping })}</span>
	</div>
</div>
