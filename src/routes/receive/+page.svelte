<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { FileDownloadQueue, RtcClientStatus } from '$components';
	import PageHeader from '$components/PageHeader.svelte';
	import { FileDecompressionStream } from '$filetransfer/file-decompression-stream';
	import { type FileDownloadData } from '$filetransfer/helper-types';
	import {
		RequestDownloadMessage,
		type FileList,
		type FileTransferMessage
	} from '$filetransfer/messages';
	import { RTCConnectionState } from '$rtc/base-client';
	import { RTCReceiver } from '$rtc/receiver';
	import { Base64, waitForSodium } from '$utils/encryption';
	import { onMount, tick } from 'svelte';

	let localPeer: RTCReceiver | null;
	let remotePeerId = $state<string | null>(null);
	let connectionState = $state(RTCConnectionState.New);
	let p2pPing = $state(0);
	let signalingPing = $state(0);
	let files = $state<FileList>({});
	let hashes = $state<Record<string, string>>({});
	let currentDownload = $state<FileDownloadData | null>(null);
	let currentDecompressedSize = $state(0);
	let progress = $derived(
		currentDownload ? (currentDecompressedSize / files[currentDownload.fileId].size) * 100 : 0
	);

	const connectToRemotePeer = async (peerId: string, sharedSecret: string) => {
		if (localPeer) return;

		localPeer = new RTCReceiver(peerId, Base64.toUint8Array(sharedSecret));
		localPeer.on('connectionStateChanged', (state) => (connectionState = state));
		localPeer.on('ping', (latency) => (p2pPing = latency));
		localPeer.on('signalingPing', (latency) => (signalingPing = latency));
		localPeer.on('controlMessage', async (message: string) => {
			try {
				const msg = JSON.parse(message) as FileTransferMessage;
				if (msg.type === 'file-list') {
					files = msg.files;
				}
			} catch (error) {
				console.error('Failed to parse file transfer message:', error);
			}
		});
		localPeer.on('fileMessage', async (data: Uint8Array) => {
			if (!currentDownload) return;

			const timeSinceLastUpdate = Date.now() - currentDownload.speed.lastUpdate;

			// Update download speed every second
			if (timeSinceLastUpdate > 1000) {
				const bytesSinceLastUpdate =
					currentDownload.data.decompressedSize - currentDownload.speed.lastFileSize;
				const bitsSinceLastUpdate = bytesSinceLastUpdate * 8;
				const bitsPerSecond = (bitsSinceLastUpdate / timeSinceLastUpdate) * 1000;
				currentDownload.speed = {
					lastUpdate: Date.now(),
					lastFileSize: currentDownload.data.decompressedSize,
					speed: bitsPerSecond
				};
			}

			await currentDownload.data.writeChunk(data);
			currentDecompressedSize = currentDownload?.data.decompressedSize ?? 0;
		});
		localPeer.init();
	};

	const requestFileDownload = (id: string) => {
		currentDownload = {
			fileId: id,
			data: new FileDecompressionStream(),
			speed: {
				lastFileSize: 0,
				lastUpdate: Date.now(),
				speed: 0
			}
		};

		currentDownload.data.onChunkAdded = () => {
			if (files[currentDownload!.fileId].size === currentDownload!.data.decompressedSize) {
				console.info(
					`Download complete: ${files[currentDownload!.fileId].name}, compression ratio: ${((currentDownload!.data.compressedSize / currentDownload!.data.decompressedSize) * 100).toFixed(0)}%`
				);

				hashes[currentDownload!.fileId] = currentDownload!.data.hash;

				const fileData = files[currentDownload!.fileId];
				const decompressedData = currentDownload!.data.getDecompressedData();
				downloadFile(decompressedData, fileData.mimeType, fileData.name);
				currentDownload = null;
				currentDecompressedSize = 0;
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

<FileDownloadQueue
	bind:files
	bind:currentDownload
	bind:progress
	bind:hashes
	downloadFile={requestFileDownload}
/>

<RtcClientStatus status={connectionState} {p2pPing} {signalingPing} />
