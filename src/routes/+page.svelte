<script lang="ts">
	import { FileUpload, FileUploadQueue, RtcClientStatus, ShareUrl } from '$components';
	import type { FileListItem } from '$filetransfer/file-list-item';
	import {
		FileChunkMessage,
		FileItem,
		FileListMessage,
		type FileTransferMessage
	} from '$filetransfer/messages';
	import { RTCConnectionState } from '$rtc/base-client';
	import { RTCSender } from '$rtc/sender';
	import { CHUNK_SIZE } from '$utils/constants';
	import { Cloud } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let files = $state.raw(new Set<FileListItem>());
	let localPeer: RTCSender | null = null;
	let shareUrl = $state<string | null>(null);
	let connectionState = $state(RTCConnectionState.New);
	let ping = $state(0);

	$effect(() => {
		if (connectionState === RTCConnectionState.DataChannelOpen) {
			sendFileList();
		} else if (connectionState === RTCConnectionState.Closed) {
			initPeerConnection();
		}
	});

	const initPeerConnection = () => {
		connectionState = RTCConnectionState.New;
		localPeer = new RTCSender();
		localPeer.on('signalingStateChanged', (isOnline) => {
			shareUrl = isOnline ? `${location.origin}/receive?i=${localPeer!.peerId}` : null;
		});
		localPeer.on('connectionStateChanged', (state) => (connectionState = state));
		localPeer.on('ping', (latency: number) => (ping = latency));
		localPeer.on('message', (message: string) => {
			try {
				const msg = JSON.parse(message) as FileTransferMessage;
				if (msg.type === 'request-download') {
					Array.from(files).forEach((item) => {
						if (msg.ids.includes(item.id)) {
							sendFile(item);
						}
					});
				}
			} catch (error) {
				console.error('Failed to parse file list message:', error);
			}
		});
		localPeer.init();
	};

	const sendFileList = () => {
		if (!localPeer) return;

		const fileList = files
			.values()
			.map((item) => new FileItem(item.id, item.file))
			.toArray();

		localPeer.sendMessage(new FileListMessage(fileList));
	};

	const sendFile = async (item: FileListItem) => {
		const totalChunkCount = Math.ceil(item.file.size / CHUNK_SIZE);

		for (let chunkIndex = 0; chunkIndex < totalChunkCount; chunkIndex++) {
			const chunk = item.file.slice(
				chunkIndex * CHUNK_SIZE,
				Math.min((chunkIndex + 1) * CHUNK_SIZE, item.file.size)
			);
			const chunkBuffer = await chunk.arrayBuffer();
			localPeer?.sendMessage(
				new FileChunkMessage(item.id, chunkIndex, Object.values(new Uint8Array(chunkBuffer)))
			);
		}
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
