<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { FileDownloadQueue, RtcClientStatus } from '$components';
	import PageHeader from '$components/PageHeader.svelte';
	import type { Chunks, TransferProgress, TransferSpeeds } from '$filetransfer/helper-types';
	import {
		FileItem,
		RequestDownloadMessage,
		type FileTransferMessage
	} from '$filetransfer/messages';
	import { RTCConnectionState } from '$rtc/base-client';
	import { RTCReceiver } from '$rtc/receiver';
	import { CHUNK_SIZE } from '$utils/constants';
	import { Base64, waitForSodium } from '$utils/encryption';
	import { onMount, tick } from 'svelte';

	let localPeer: RTCReceiver | null;
	let remotePeerId = $state<string | null>(null);
	let connectionState = $state(RTCConnectionState.New);
	let ping = $state(0);
	let files = $state<Set<FileItem>>(new Set([]));
	let chunks = $state<Chunks>({});
	let progress = $derived(
		Array.from(files).reduce((result, file) => {
			result[file.id] =
				((chunks[file.id]?.chunkCount ?? 0) / Math.ceil(file.size / CHUNK_SIZE)) * 100;
			return result;
		}, {} as TransferProgress)
	);
	let downloadSpeed = $state<TransferSpeeds>({});

	const connectToRemotePeer = async (peerId: string, sharedSecret: string) => {
		if (localPeer) return;

		localPeer = new RTCReceiver(peerId, Base64.toUint8Array(sharedSecret));
		localPeer.on('connectionStateChanged', (state) => (connectionState = state));
		localPeer.on('ping', (latency) => (ping = latency));
		localPeer.on('controlMessage', (message: string) => {
			try {
				const msg = JSON.parse(message) as FileTransferMessage;
				if (msg.type === 'file-list') {
					files = new Set(msg.files);
				}
			} catch (error) {
				console.error('Failed to parse file transfer message:', error);
			}
		});
		localPeer.on('fileMessage', (message: string) => {
			try {
				const msg = JSON.parse(message) as FileTransferMessage;
				if (msg.type === 'file-chunk') {
					const { fileId, index, data } = msg;
					const fileData = Array.from(files).find((x) => x.id === fileId);

					if (!fileData) return;

					if (chunks[fileId] === undefined) {
						chunks[fileId] = {
							chunkCount: 0,
							data: new Uint8Array(fileData.size)
						};

						downloadSpeed[fileId] = {
							lastUpdate: Date.now(),
							lastChunkCount: 1,
							speed: CHUNK_SIZE * 8 // Initial speed in bits per second
						};
					} else {
						const timeSinceLastUpdate = Date.now() - downloadSpeed[fileId].lastUpdate;

						if (timeSinceLastUpdate > 1000) {
							const chunkCountSinceLastUpdate =
								chunks[fileId].chunkCount - downloadSpeed[fileId].lastChunkCount;
							const dataSizeSinceLastUpdate = chunkCountSinceLastUpdate * CHUNK_SIZE * 8; // in bits
							const dataSizeInOneSecond = (dataSizeSinceLastUpdate / timeSinceLastUpdate) * 1000;
							downloadSpeed[fileId] = {
								lastUpdate: Date.now(),
								lastChunkCount: chunks[fileId].chunkCount,
								speed: dataSizeInOneSecond
							};
						}
					}

					chunks[fileId].data.set(data, index * CHUNK_SIZE);
					chunks[fileId].chunkCount++;

					const totalChunkCount = Math.ceil(fileData.size / CHUNK_SIZE);
					if (chunks[fileId].chunkCount === totalChunkCount) {
						downloadFile(chunks[fileId].data, fileData.mimeType, fileData.name);

						delete chunks[fileId];
						delete downloadSpeed[fileId];
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
		localPeer?.sendControlMessage(requestDownloadMsg);
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

	onMount(async () => {
		await waitForSodium();

		const params = new URLSearchParams(location.search);
		const encryptionKey = location.hash.startsWith('#')
			? location.hash.substring(1)
			: location.hash;
		if (params.has('i') && encryptionKey.length > 4) {
			remotePeerId = params.get('i');
			if (remotePeerId) {
				// Update the URL to remove the peer ID parameter
				tick().then(() => replaceState(location.pathname, page.state));

				connectToRemotePeer(remotePeerId, encryptionKey);
			}
		}
	});
</script>

<svelte:head>
	<title>📥 Receive files</title>
</svelte:head>

<PageHeader status={connectionState} />

<FileDownloadQueue {files} {progress} {downloadSpeed} downloadFile={requestFileDownload} />

<RtcClientStatus status={connectionState} {ping} />
