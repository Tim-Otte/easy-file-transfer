<script lang="ts">
	import { FileIcon } from '$components';
	import type { FileItem } from '$filetransfer/messages';
	import { m } from '$messages';
	import { formatSize } from '$utils/file-size.js';
	import { Download } from '@lucide/svelte';

	interface Props {
		files: Set<FileItem>;
		downloadFile: (id: string) => void;
	}

	let { files = $bindable(), downloadFile }: Props = $props();
	let totalFileSize = $derived(Array.from(files).reduce((sum, file) => sum + file.size, 0));
</script>

<div class="mt-4 flex items-end justify-between">
	<h3 class="mt-8 text-xl font-semibold">
		{m.download_queue_title()}
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
		<div
			class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 shadow dark:border-gray-700 dark:bg-zinc-700"
		>
			<FileIcon type={file.mimeType} class="mr-1 text-2xl text-zinc-400" />
			<div class="min-w-0 flex-1">
				<div class="truncate font-medium">{file.name}</div>
				<div class="text-xs text-gray-500 dark:text-gray-400">
					{formatSize(file.size)}
				</div>
			</div>
			<button
				class="cursor-pointer rounded p-2 text-green-500 transition-colors duration-200 hover:bg-zinc-800"
				onclick={() => downloadFile(file.id)}
				aria-label="Download file"
			>
				<Download class="h-5 w-5" />
			</button>
		</div>
	{:else}
		<div class="text-gray-500 dark:text-gray-400 text-sm">
			{m.download_queue_empty()}
		</div>
	{/each}
</div>
