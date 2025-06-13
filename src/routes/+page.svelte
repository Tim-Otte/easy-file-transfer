<script lang="ts">
	import { FileUpload, FileUploadQueue, RtcClientStatus, ShareUrl } from '$components';
	import { FileItem, FileListMessage } from '$filetransfer/messages';
	import { RTCConnectionState } from '$rtc/base-client';
	import { RTCSender } from '$rtc/sender';
	import { Cloud } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let files = $state.raw(new Set<File>());
	let localPeer: RTCSender | null = null;
	let shareUrl = $state<string | null>(null);
	let connectionState = $state(RTCConnectionState.New);
	let ping = $state(0);

	$effect(() => {
		if (connectionState === RTCConnectionState.DataChannelOpen) {
			sendFileList();
		}
	});

	const initPeerConnection = () => {
		connectionState = RTCConnectionState.New;
		localPeer = new RTCSender();
		localPeer.on('signalingStateChanged', (isOnline: boolean) => {
			if (isOnline) {
				shareUrl = `${location.origin}/receive?i=${localPeer!.peerId}`;
			} else {
				shareUrl = null;
			}
		});
		localPeer.on('connectionStateChanged', (state: RTCConnectionState) => {
			connectionState = state;
			if (state === RTCConnectionState.Closed) {
				initPeerConnection();
			} else if (state === RTCConnectionState.DataChannelOpen) {
				sendFileList();
			}
		});
		localPeer.on('ping', (latency: number) => {
			ping = latency;
		});
		localPeer.init();
	};

	const sendFileList = () => {
		if (!localPeer) return;

		const fileList = files
			.values()
			.map((file) => new FileItem(file.name, file.size, file.type, file.lastModified))
			.toArray();

		localPeer.sendMessage(JSON.stringify(new FileListMessage(fileList)));
	};

	onMount(() => {
		initPeerConnection();
	});
</script>

<svelte:head>
	<title>📄 File upload</title>
</svelte:head>

<div class="mb-4 flex flex-row items-center justify-between font-[Space_Grotesk]">
	<h1 class="text-3xl font-bold">
		<Cloud size="35" class="mr-3 inline align-text-bottom text-blue-600" /> Easy file transfer
	</h1>
	<ShareUrl url={shareUrl} />
</div>

<FileUpload bind:files />
<FileUploadQueue bind:files />

<RtcClientStatus status={connectionState} {ping} />
