<script lang="ts">
	import type { FileItem } from '$filetransfer/messages';
	import { m } from '$messages';
	import { formatSize } from '$utils/file-size.js';
	import { Download } from '@lucide/svelte';
	import FileQueueItem from './FileQueueItem.svelte';

	interface Props {
		files: Set<FileItem>;
		downloadFile: (id: string) => void;
	}

	let { files = $bindable(), downloadFile }: Props = $props();
	let totalFileSize = $derived(Array.from(files).reduce((sum, file) => sum + file.size, 0));
</script>

<div class="mt-4 flex items-end justify-between">
	<h3 class="mt-8 text-xl font-semibold">
		<span class="font-[Space_Grotesk]">{m.download_queue_title()}</span>
		<span class={['ml-1 text-xs text-gray-500 dark:text-gray-400', !files.size && 'hidden']}>
			{m.download_queue_subtitle({
				fileCount: files.size,
				totalSize: formatSize(totalFileSize)
			})}</span
		>
	</h3>
</div>
<div class="mt-4 space-y-4">
	{#each files as file (file.id)}
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
