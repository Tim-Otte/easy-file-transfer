<script lang="ts">
	import { FileUpload, FileUploadQueue, RtcClientStatus, ShareUrl } from '$components';
	import PageHeader from '$components/PageHeader.svelte';
	import { FileListItem } from '$filetransfer/file-list-item';
	import type { FileUploadData } from '$filetransfer/helper-types';
	import {
		FileData,
		FileListMessage,
		type FileList,
		type FileTransferMessage
	} from '$filetransfer/messages';
	import { RTCConnectionState } from '$rtc/base-client';
	import { RTCSender } from '$rtc/sender';
	import { COMPRESSION_ALGORITHM } from '$utils/constants';
	import { Base64, Hashing, waitForSodium, X25519 } from '$utils/encryption';
	import { onMount } from 'svelte';

	let files = $state.raw(new Set<FileListItem>());
	let hashes = $state<Record<string, string>>({});
	let localPeer: RTCSender | null = null;
	let shareUrl = $state<string | null>(null);
	let connectionState = $state(RTCConnectionState.New);
	let ping = $state(0);
	let currentUpload = $state<FileUploadData | null>(null);
	let progress = $derived(
		currentUpload
			? (currentUpload.sentBytes /
					Array.from(files).find((x) => x.id == currentUpload!.fileId)!.file.size) *
					100
			: 0
	);

	$effect(() => {
		if (connectionState === RTCConnectionState.DataChannelOpen) {
			sendFileList();
		} else if (connectionState === RTCConnectionState.Closed) {
			initPeerConnection();
		}
	});

	const initPeerConnection = () => {
		connectionState = RTCConnectionState.New;
		const sharedSecret = X25519.generateSharedSecret();

		localPeer = new RTCSender(sharedSecret);
		localPeer.on('signalingStateChanged', (isOnline) => {
			shareUrl = isOnline
				? `${location.origin}/receive?i=${localPeer!.peerId}#${Base64.fromUint8Array(sharedSecret)}`
				: null;
		});
		localPeer.on('connectionStateChanged', (state) => (connectionState = state));
		localPeer.on('ping', (latency) => (ping = latency));
		localPeer.on('controlMessage', (message: string) => {
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

		const fileList = Array.from(files).reduce((result, item) => {
			result[item.id] = new FileData(item.file);
			return result;
		}, {} as FileList);

		localPeer.sendControlMessage(new FileListMessage(fileList));
	};

	const sendFile = async (item: FileListItem) => {
		currentUpload = {
			fileId: item.id,
			sentBytes: 0,
			speed: {
				lastFileSize: 0,
				lastUpdate: Date.now(),
				speed: 0
			}
		};

		const fileHash = Hashing.init();

		const compressedFileReader = item.file
			.stream()
			.pipeThrough(
				new TransformStream({
					transform(chunk, controller) {
						controller.enqueue(chunk);

						// Update the hashing stream with the current chunk
						Hashing.update(fileHash, chunk);

						// Update the progress and speed
						currentUpload!.sentBytes += chunk.byteLength;

						const timeSinceLastUpdate = Date.now() - currentUpload!.speed.lastUpdate;
						if (timeSinceLastUpdate > 1000) {
							const bytesSinceLastUpdate =
								currentUpload!.sentBytes - currentUpload!.speed.lastFileSize;
							const bitsSinceLastUpdate = bytesSinceLastUpdate * 8;
							const bitsPerSecond = (bitsSinceLastUpdate / timeSinceLastUpdate) * 1000;
							currentUpload!.speed = {
								lastUpdate: Date.now(),
								lastFileSize: currentUpload!.sentBytes,
								speed: bitsPerSecond
							};
						}
					}
				})
			)
			.pipeThrough(new CompressionStream(COMPRESSION_ALGORITHM))
			.getReader();

		do {
			const { done, value } = await compressedFileReader.read();

			if (done) break;

			try {
				await localPeer?.sendFileMessage(value);
			} catch (error) {
				console.error('Failed to send file chunk:', error);
				break;
			}
		} while (true);

		hashes[item.id] = Hashing.finalize(fileHash);

		currentUpload = null;
	};

	onMount(async () => {
		await waitForSodium();
		initPeerConnection();
	});
</script>

<svelte:head>
	<title>📄 File upload</title>
</svelte:head>

<PageHeader status={connectionState}>
	<ShareUrl url={shareUrl} />
</PageHeader>

<FileUpload bind:files />
<FileUploadQueue bind:files bind:currentUpload bind:progress bind:hashes />

<RtcClientStatus status={connectionState} {ping} />
