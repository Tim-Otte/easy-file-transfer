<script lang="ts">
	import { RTCConnectionState } from '$rtc/base-client';
	import { RTCReceiver } from '$rtc/receiver';
	import { onMount, tick } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { RtcClientStatus } from '$components';

	let localPeer: RTCReceiver | null;
	let remotePeerId = $state<string | null>(null);
	let connectionState = $state(RTCConnectionState.New);

	const connectToRemotePeer = (peerId: string) => {
		if (localPeer) return;

		localPeer = new RTCReceiver(peerId);
		localPeer.on('connectionStateChanged', (state: RTCConnectionState) => {
			connectionState = state;
			if (state === RTCConnectionState.DataChannelOpen) {
				localPeer!.sendMessage('test');
			}
		});
		localPeer.init();
	};

	onMount(() => {
		const params = new URLSearchParams(location.search);
		if (params.has('i')) {
			remotePeerId = params.get('i');
			if (remotePeerId) {
				// Update the URL to remove the peer ID parameter
				tick().then(() => replaceState(location.pathname, page.state));

				connectToRemotePeer(remotePeerId);
			}
		}
	});
</script>

<svelte:head>
	<title>📥 Receive files</title>
</svelte:head>

<div class="flex flex-row gap-2">
	<input
		type="text"
		placeholder="Enter remote peer ID"
		bind:value={remotePeerId}
		class="mb-4 w-full rounded-lg border p-2 dark:bg-zinc-800 dark:text-white"
	/>
</div>

<RtcClientStatus status={connectionState} />
