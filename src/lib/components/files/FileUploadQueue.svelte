<script lang="ts">
	import { m } from '$messages';
	import { Trash } from '@lucide/svelte';
	import { formatSize } from '$utils/file-size.js';
	import { FileIcon } from '$components';

	interface Props {
		files: Set<File>;
	}

	let { files = $bindable() }: Props = $props();
	let totalFileSize = $derived(Array.from(files).reduce((sum, file) => sum + file.size, 0));
</script>

<div class="mt-4 flex items-end justify-between">
	<h3 class="mt-8 text-xl font-semibold">
		{m.upload_queue_title()}
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
			<button
				class="cursor-pointer rounded p-2 text-red-500 transition-colors duration-200 hover:bg-zinc-800"
				onclick={() => {
					files = new Set(Array.from(files).filter((f) => f !== file));
				}}
				aria-label="Remove file"
			>
				<Trash class="h-5 w-5" />
			</button>
		</div>
	{:else}
		<div class="text-gray-500 dark:text-gray-400 text-sm">
			{m.upload_queue_empty()}
		</div>
	{/each}
</div>
