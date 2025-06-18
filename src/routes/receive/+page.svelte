<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { FileDownloadQueue, RtcClientStatus } from '$components';
	import {
		FileItem,
		RequestDownloadMessage,
		type FileTransferMessage
	} from '$filetransfer/messages';
	import { RTCConnectionState } from '$rtc/base-client';
	import { RTCReceiver } from '$rtc/receiver';
	import { CHUNK_SIZE } from '$utils/constants';
	import { Cloud } from '@lucide/svelte';
	import { onMount, tick } from 'svelte';

	type ChunkData = { index: number; data: number[] };

	let localPeer: RTCReceiver | null;
	let remotePeerId = $state<string | null>(null);
	let connectionState = $state(RTCConnectionState.New);
	let ping = $state(0);
	let files = $state<Set<FileItem>>(new Set([]));
	let chunks: { [fileName: string]: ChunkData[] } = {};

	const connectToRemotePeer = (peerId: string) => {
		if (localPeer) return;

		localPeer = new RTCReceiver(peerId);
		localPeer.on('connectionStateChanged', (state) => (connectionState = state));
		localPeer.on('ping', (latency) => (ping = latency));
		localPeer.on('message', (message: string) => {
			try {
				const msg = JSON.parse(message) as FileTransferMessage;
				if (msg.type === 'file-list') {
					files = new Set(msg.files);
				} else if (msg.type === 'file-chunk') {
					const { fileId, ...chunk }: { fileId: string } & ChunkData = msg;
					const fileData = Array.from(files).find((x) => x.id === fileId);

					if (!fileData) return;

					const { name } = fileData;

					if (chunks[name] === undefined) {
						chunks[name] = [chunk];
					} else {
						chunks[name].push(chunk);
					}

					const totalChunkCount = Math.ceil(fileData.size / CHUNK_SIZE);
					if (chunks[name].length === totalChunkCount) {
						const merged = new Uint8Array(fileData.size);

						chunks[name].forEach((chunk) => {
							merged.set(chunk.data, chunk.index * CHUNK_SIZE);
						});
						chunks[name] = [];
						downloadFile(merged, fileData.mimeType, name);
					}
				}
			} catch (error) {
				console.error('Failed to parse file transfer message:', error);
			}
		});
		localPeer.init();
	};

	const requestFileDownload = (id: string) => {
		const requestDownloadMsg = new RequestDownloadMessage([id]);
		localPeer?.sendMessage(requestDownloadMsg);
	};

	const downloadFile = (data: Uint8Array, type: string, fileName: string) => {
		const blob = new Blob([data], { type });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = fileName;
		a.click();
		URL.revokeObjectURL(url);
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

<FileDownloadQueue {files} downloadFile={requestFileDownload} />

<RtcClientStatus status={connectionState} {ping} />
