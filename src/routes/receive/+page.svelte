<script lang="ts">
	import { RTCConnectionState } from '$rtc/base-client';
	import { RTCReceiver } from '$rtc/receiver';
	import { onMount, tick } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { RtcClientStatus } from '$components';
	import { FileItem, FileListMessage, type IFileTransferMessage } from '$filetransfer/messages';
	import { FileDownloadQueue } from '$components';
	import { Cloud } from '@lucide/svelte';

	let localPeer: RTCReceiver | null;
	let remotePeerId = $state<string | null>(null);
	let connectionState = $state(RTCConnectionState.New);
	let ping = $state(0);
	let files = $state<Set<FileItem>>(new Set([]));

	const connectToRemotePeer = (peerId: string) => {
		if (localPeer) return;

		localPeer = new RTCReceiver(peerId);
		localPeer.on('connectionStateChanged', (state: RTCConnectionState) => {
			connectionState = state;
		});
		localPeer.on('ping', (latency: number) => {
			ping = latency;
		});
		localPeer.on('message', (message: string) => {
			try {
				const msg = JSON.parse(message) as IFileTransferMessage;
				if (msg.type === 'file-list') {
					const fileListMessage = msg as FileListMessage;
					files = new Set(fileListMessage.files);
				}
			} catch (error) {
				console.error('Failed to parse file list message:', error);
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

<div class="mb-4 flex flex-row items-center justify-between font-[Space_Grotesk]">
	<h1 class="text-3xl font-bold">
		<Cloud size="35" class="mr-3 inline align-text-bottom text-blue-600" /> Easy file transfer
	</h1>
</div>

<FileDownloadQueue {files} />

<RtcClientStatus status={connectionState} {ping} />
