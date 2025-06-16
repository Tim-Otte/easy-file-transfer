<script lang="ts">
	import { RTCConnectionState } from '$rtc/base-client';
	import { RTCReceiver } from '$rtc/receiver';
	import { onMount, tick } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { RtcClientStatus } from '$components';
	import {
		FileChunkMessage,
		FileItem,
		FileListMessage,
		RequestDownloadMessage,
		type IFileTransferMessage
	} from '$filetransfer/messages';
	import { FileDownloadQueue } from '$components';
	import { Cloud } from '@lucide/svelte';
	import { CHUNK_SIZE } from '$utils/constants';

	let localPeer: RTCReceiver | null;
	let remotePeerId = $state<string | null>(null);
	let connectionState = $state(RTCConnectionState.New);
	let ping = $state(0);
	let files = $state<Set<FileItem>>(new Set([]));
	let chunks: { [fileName: string]: { index: number; data: number[] }[] } = {};

	const connectToRemotePeer = (peerId: string) => {
		if (localPeer) return;

		localPeer = new RTCReceiver(peerId);
		localPeer.on('connectionStateChanged', (state) => (connectionState = state));
		localPeer.on('ping', (latency) => (ping = latency));
		localPeer.on('message', (message: string) => {
			try {
				const msg = JSON.parse(message) as IFileTransferMessage;
				if (msg.type === 'file-list') {
					const fileListMessage = msg as FileListMessage;
					files = new Set(fileListMessage.files);
				} else if (msg.type === 'file-chunk') {
					const { index, data, fileName, totalCount } = msg as FileChunkMessage;

					if (chunks[fileName] === undefined) {
						chunks[fileName] = [{ index, data }];
					} else {
						chunks[fileName].push({ index, data });
					}

					if (chunks[fileName].length == totalCount) {
						const fileData = Array.from(files).find((x) => x.name == fileName);
						const merged = new Uint8Array(fileData!.size);

						chunks[fileName].forEach((chunk) => {
							merged.set(chunk.data, chunk.index * CHUNK_SIZE);
						});
						chunks[fileName] = [];
						downloadFile(merged, fileData!.type, fileName);
					}
				}
			} catch (error) {
				console.error('Failed to parse file list message:', error);
			}
		});
		localPeer.init();
	};

	const requestFileDownload = (fileName: string) => {
		const requestDownloadMsg = new RequestDownloadMessage([fileName]);
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
