<script lang="ts">
	import { FileQueueItem } from '$components';
	import type { FileListItem } from '$filetransfer/file-list-item';
	import type { FileUploadData } from '$filetransfer/helper-types';
	import { m } from '$messages';
	import { formatSize } from '$utils/file-size.js';
	import { tooltip } from '$utils/tooltip.svelte';
	import { Trash } from '@lucide/svelte';

	interface Props {
		files: Set<FileListItem>;
		currentUpload: FileUploadData | null;
		progress: number;
		hashes: Record<string, string>;
	}

	let {
		files = $bindable(),
		progress = $bindable(),
		currentUpload = $bindable(),
		hashes = $bindable()
	}: Props = $props();

	let currentUploadedFile = $derived(
		Array.from(files).find((item) => item.id === currentUpload?.fileId)
	);
	let filesInQueue = $derived(
		Array.from(files).filter((item) => item.id !== currentUpload?.fileId)
	);
	let totalQueueFileSize = $derived(filesInQueue.reduce((sum, item) => sum + item.file.size, 0));

	const deleteFile = (id: string) => {
		files = new Set(Array.from(files).filter((f) => f.id !== id));
	};
</script>

{#if currentUpload}
	<div class="mt-4 flex items-end justify-between">
		<h3 class="mt-8 text-xl font-semibold">
			<span class="font-[Space_Grotesk]">{m.currently_uploading()}</span>
		</h3>
	</div>
	<FileQueueItem
		{...currentUploadedFile!.file}
		fileId={currentUpload.fileId}
		mimeType={currentUploadedFile!.file.type}
		{progress}
		speed={currentUpload.speed?.speed ?? 0}
		actionButton={null}
		class="mt-4"
	/>
{/if}

<div class="mt-4 flex items-end justify-between">
	<h3 class="mt-8 flex flex-col items-baseline text-xl font-semibold sm:flex-row">
		<span class="font-[Space_Grotesk]">{m.upload_queue_title()}</span>
		<span
			class={[
				'text-xs text-neutral-500 sm:ml-2 dark:text-neutral-400',
				!filesInQueue.length && 'hidden'
			]}
		>
			{m.upload_queue_subtitle({
				fileCount: filesInQueue.length,
				totalSize: formatSize(totalQueueFileSize)
			})}</span
		>
	</h3>
	<button
		class={`cursor-pointer rounded px-3 py-1 text-red-500 transition-colors duration-400 hover:not-disabled:bg-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 hover:not-disabled:dark:bg-neutral-700 disabled:dark:bg-neutral-700 disabled:dark:text-neutral-900`}
		onclick={() => (files = new Set())}
		disabled={files.size === 0 || currentUpload !== null}
		aria-label={m.clear_upload_queue_tooltip()}
		use:tooltip={{ content: m.clear_upload_queue_tooltip(), placement: 'left' }}
	>
		{m.clear_upload_queue()}
	</button>
</div>
<div class="mt-4 space-y-4">
	{#each filesInQueue as item (item.id)}
		<FileQueueItem
			{...item.file}
			fileId={item.id}
			mimeType={item.file.type}
			hash={hashes[item.id]}
			actionButton={{
				action: deleteFile,
				icon: Trash,
				class: 'text-red-500',
				disabled: currentUpload !== null,
				tooltip: m.remove_file_tooltip()
			}}
		/>
	{:else}
		<div class="text-neutral-500 dark:text-neutral-400 text-sm">
			{m.upload_queue_empty()}
		</div>
	{/each}
</div>
