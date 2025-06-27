<script lang="ts">
	import type { FileDownloadData } from '$filetransfer/helper-types';
	import type { FileList } from '$filetransfer/messages';
	import { m } from '$messages';
	import { formatSize } from '$utils/file-size.js';
	import { Download } from '@lucide/svelte';
	import FileQueueItem from './FileQueueItem.svelte';

	interface Props {
		files: FileList;
		currentDownload: FileDownloadData | null;
		progress: number;
		hashes: Record<string, string>;
		downloadFile: (id: string) => void;
	}

	let {
		files = $bindable(),
		progress = $bindable(),
		currentDownload = $bindable(),
		hashes = $bindable(),
		downloadFile
	}: Props = $props();

	let filesInQueue = $derived(
		Object.entries(files).filter(([fileId]) => fileId !== currentDownload?.fileId)
	);
	let totalQueueFileSize = $derived(
		Array.from(filesInQueue).reduce((sum, [, file]) => sum + file.size, 0)
	);
</script>

{#if currentDownload}
	<div class="mt-4 flex items-end justify-between">
		<h3 class="mt-8 text-xl font-semibold">
			<span class="font-[Space_Grotesk]">{m.currently_downloading()}</span>
		</h3>
	</div>
	<FileQueueItem
		{...files[currentDownload.fileId]}
		fileId={currentDownload.fileId}
		{progress}
		speed={currentDownload.speed?.speed ?? 0}
		actionButton={null}
		class="mt-4"
	/>
{/if}

<div class="mt-4 flex items-end justify-between">
	<h3 class="mt-8 text-xl font-semibold">
		<span class="font-[Space_Grotesk]">{m.download_queue_title()}</span>
		<span
			class={['ml-1 text-xs text-zinc-500 dark:text-zinc-400', !filesInQueue.length && 'hidden']}
		>
			{m.download_queue_subtitle({
				fileCount: filesInQueue.length,
				totalSize: formatSize(totalQueueFileSize)
			})}</span
		>
	</h3>
</div>
<div class="mt-4 space-y-4">
	{#each filesInQueue as [id, file] (id)}
		<FileQueueItem
			{...file}
			fileId={id}
			hash={hashes[id]}
			actionButton={{
				action: downloadFile,
				icon: Download,
				class: 'text-green-700 dark:text-green-500',
				disabled: currentDownload !== null
			}}
		/>
	{:else}
		<div class="text-zinc-500 dark:text-zinc-400 text-sm">
			{m.download_queue_empty()}
		</div>
	{/each}
</div>
