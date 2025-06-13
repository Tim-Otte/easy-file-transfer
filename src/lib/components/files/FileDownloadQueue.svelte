<script lang="ts">
	import { m } from '$messages';
	import { Trash } from '@lucide/svelte';
	import { formatSize } from '$utils/file-size.js';
	import { FileIcon } from '$components';
	import type { FileItem } from '$filetransfer/messages';

	interface Props {
		files: Set<FileItem>;
	}

	let { files = $bindable() }: Props = $props();
	let totalFileSize = $derived(files.values().reduce((sum, file) => sum + file.size, 0));
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
	{#each files as file (file.name + file.size)}
		<div
			class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 shadow dark:border-gray-700 dark:bg-zinc-700"
		>
			<FileIcon type={file.type} class="mr-1 text-2xl text-zinc-400" />
			<div class="min-w-0 flex-1">
				<div class="truncate font-medium">{file.name}</div>
				<div class="text-xs text-gray-500 dark:text-gray-400">
					{formatSize(file.size)}
				</div>
			</div>
		</div>
	{:else}
		<div class="text-gray-500 dark:text-gray-400 text-sm">
			{m.download_queue_empty()}
		</div>
	{/each}
</div>
