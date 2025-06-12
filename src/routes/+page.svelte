<script lang="ts">
	import { FileUpload, FileUploadQueue, RtcClientStatus, ShareUrl } from '$components';
	import { RTCConnectionState } from '$rtc/base-client';
	import { RTCSender } from '$rtc/sender';
	import { onMount } from 'svelte';

	let files = $state.raw(new Set<File>());
	let rtcSender: RTCSender | null = null;
	let shareUrl = $state<string | null>(null);
	let connectionState = $state(RTCConnectionState.New);

	onMount(() => {
		rtcSender = new RTCSender();
		rtcSender.on('signalingStateChanged', (isOnline: boolean) => {
			if (isOnline) {
				shareUrl = `${location.origin}/receive?i=${rtcSender!.peerId}`;
			} else {
				shareUrl = null;
			}
		});
		rtcSender.on('connectionStateChanged', (state: RTCConnectionState) => {
			connectionState = state;
			if (state === RTCConnectionState.DataChannelOpen) {
				rtcSender!.sendMessage('test');
			}
		});
		rtcSender.init();
	});
</script>

<svelte:head>
	<title>📄 File upload</title>
</svelte:head>

<div class="mb-4 flex flex-row items-center justify-between font-[Space_Grotesk]">
	<h1 class="text-3xl font-bold">Easy file transfer</h1>
	<ShareUrl url={shareUrl} />
</div>

<FileUpload bind:files />
<FileUploadQueue bind:files />

<RtcClientStatus status={connectionState} />
