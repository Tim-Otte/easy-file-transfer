<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { FileDownloadQueue, RtcClientStatus } from '$components';
	import PageHeader from '$components/PageHeader.svelte';
	import { type TransferData } from '$filetransfer/helper-types';
	import {
		RequestDownloadMessage,
		type FileList,
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
	let files = $state<FileList>({});
	let currentDownload = $state<TransferData | null>(null);
	let progress = $derived(
		currentDownload
			? (currentDownload.chunks.chunkCount /
					Math.ceil(files[currentDownload.fileId].size / CHUNK_SIZE)) *
					100
			: 0
	);

	const connectToRemotePeer = async (peerId: string, sharedSecret: string) => {
		if (localPeer) return;

		localPeer = new RTCReceiver(peerId, Base64.toUint8Array(sharedSecret));
		localPeer.on('connectionStateChanged', (state) => (connectionState = state));
		localPeer.on('ping', (latency) => (ping = latency));
		localPeer.on('controlMessage', (message: string) => {
			try {
				const msg = JSON.parse(message) as FileTransferMessage;
				if (msg.type === 'file-list') {
					files = msg.files;
				}
			} catch (error) {
				console.error('Failed to parse file transfer message:', error);
			}
		});
		localPeer.on('fileMessage', (data: Uint8Array) => {
			if (!currentDownload) return;

			const timeSinceLastUpdate = Date.now() - currentDownload.speed.lastUpdate;

			// Update download speed every second
			if (timeSinceLastUpdate > 1000) {
				const chunkCountSinceLastUpdate =
					currentDownload.chunks.chunkCount - currentDownload.speed.lastChunkCount;
				const bitsSinceLastUpdate = chunkCountSinceLastUpdate * CHUNK_SIZE * 8;
				const bitsPerSecond = (bitsSinceLastUpdate / timeSinceLastUpdate) * 1000;
				currentDownload.speed = {
					lastUpdate: Date.now(),
					lastChunkCount: currentDownload.chunks.chunkCount,
					speed: bitsPerSecond
				};
			}

			currentDownload.chunks.data.set(data, currentDownload.chunks.chunkCount * CHUNK_SIZE);
			currentDownload.chunks.chunkCount++;

			const fileData = files[currentDownload.fileId];
			const totalChunkCount = Math.ceil(fileData.size / CHUNK_SIZE);
			if (currentDownload.chunks.chunkCount === totalChunkCount) {
				downloadFile(currentDownload.chunks.data, fileData.mimeType, fileData.name);

				currentDownload = null;
			}
		});
		localPeer.init();
	};

	const requestFileDownload = (id: string) => {
		currentDownload = {
			fileId: id,
			chunks: {
				chunkCount: 0,
				data: new Uint8Array(files[id].size)
			},
			speed: {
				lastChunkCount: 0,
				lastUpdate: Date.now(),
				speed: 0
			}
		};

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

<FileDownloadQueue {files} {currentDownload} {progress} downloadFile={requestFileDownload} />

<RtcClientStatus status={connectionState} {ping} />
