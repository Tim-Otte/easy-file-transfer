<script lang="ts">
	import { FileQueueItem } from '$components';
	import type { FileListItem } from '$filetransfer/file-list-item';
	import { m } from '$messages';
	import { formatSize } from '$utils/file-size.js';
	import { Trash } from '@lucide/svelte';

	interface Props {
		files: Set<FileListItem>;
	}

	let { files = $bindable() }: Props = $props();
	let totalFileSize = $derived(Array.from(files).reduce((sum, item) => sum + item.file.size, 0));

	const deleteFile = (id: string) => {
		files = new Set(Array.from(files).filter((f) => f.id !== id));
	};
</script>

<div class="mt-4 flex items-end justify-between">
	<h3 class="mt-8 text-xl font-semibold">
		<span class="font-[Space_Grotesk]">{m.upload_queue_title()}</span>
		<span class={['ml-1 text-xs text-gray-500 dark:text-gray-400', !files.size && 'hidden']}>
			{m.upload_queue_subtitle({
				fileCount: files.size,
				totalSize: formatSize(totalFileSize)
			})}</span
		>
	</h3>
	<button
		class={`cursor-pointer rounded px-3 py-1 text-red-500 transition-colors duration-400 hover:not-disabled:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-900`}
		onclick={() => (files = new Set())}
		disabled={files.size === 0}
		aria-label="Clear upload queue"
	>
		{m.clear_upload_queue()}
	</button>
</div>
<div class="mt-4 space-y-4">
	{#each files as item (item.id)}
		<FileQueueItem
			{...item.file}
			fileId={item.id}
			mimeType={item.file.type}
			actionButton={{
				action: deleteFile,
				icon: Trash,
				class: 'text-red-500'
			}}
		/>
	{:else}
		<div class="text-gray-500 dark:text-gray-400 text-sm">
			{m.upload_queue_empty()}
		</div>
	{/each}
</div>
