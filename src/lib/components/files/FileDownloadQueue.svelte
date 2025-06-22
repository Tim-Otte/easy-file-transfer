<script lang="ts">
	import type { TransferProgress, TransferSpeeds } from '$filetransfer/helper-types';
	import type { FileItem } from '$filetransfer/messages';
	import { m } from '$messages';
	import { formatSize } from '$utils/file-size.js';
	import { Download } from '@lucide/svelte';
	import FileQueueItem from './FileQueueItem.svelte';

	interface Props {
		files: Set<FileItem>;
		progress: TransferProgress;
		downloadSpeed: TransferSpeeds;
		downloadFile: (id: string) => void;
	}

	let {
		files = $bindable(),
		progress = $bindable(),
		downloadSpeed = $bindable(),
		downloadFile
	}: Props = $props();

	let downloadingFiles = $derived(
		Array.from(files).filter((file) => downloadSpeed[file.id] !== undefined)
	);
	let filesInQueue = $derived(
		Array.from(files).filter((file) => downloadSpeed[file.id] === undefined)
	);
	let totalQueueFileSize = $derived(
		Array.from(filesInQueue).reduce((sum, file) => sum + file.size, 0)
	);
</script>

{#if downloadingFiles.length > 0}
	<div class="mt-4 flex items-end justify-between">
		<h3 class="mt-8 text-xl font-semibold">
			<span class="font-[Space_Grotesk]">{m.currently_downloading()}</span>
		</h3>
	</div>
	<div class="mt-4 space-y-4">
		{#each downloadingFiles as file (file.id)}
			<FileQueueItem
				{...file}
				fileId={file.id}
				progress={progress[file.id]}
				speed={downloadSpeed[file.id]?.speed ?? 0}
				actionButton={{
					action: downloadFile,
					icon: Download,
					class: 'text-green-500'
				}}
			/>
		{/each}
	</div>
{/if}

<div class="mt-4 flex items-end justify-between">
	<h3 class="mt-8 text-xl font-semibold">
		<span class="font-[Space_Grotesk]">{m.download_queue_title()}</span>
		<span
			class={['ml-1 text-xs text-gray-500 dark:text-gray-400', !filesInQueue.length && 'hidden']}
		>
			{m.download_queue_subtitle({
				fileCount: filesInQueue.length,
				totalSize: formatSize(totalQueueFileSize)
			})}</span
		>
	</h3>
</div>
<div class="mt-4 space-y-4">
	{#each filesInQueue as file (file.id)}
		<FileQueueItem
			{...file}
			fileId={file.id}
			actionButton={{
				action: downloadFile,
				icon: Download,
				class: 'text-green-500'
			}}
		/>
	{:else}
		<div class="text-gray-500 dark:text-gray-400 text-sm">
			{m.download_queue_empty()}
		</div>
	{/each}
</div>
