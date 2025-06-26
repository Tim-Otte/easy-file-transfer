<script lang="ts">
	import { FileListItem } from '$filetransfer/file-list-item';
	import { m } from '$messages';
	import { ArrowDown, Upload } from '@lucide/svelte';

	interface Props {
		files: Set<FileListItem>;
	}

	let { files = $bindable() }: Props = $props();
	let dragActive = $state(false);

	const getNewFileId = () => {
		do {
			let id = crypto.randomUUID().split('-')[4];
			if (!Array.from(files).find((x) => x.id === id)) return id;
		} while (true);
	};

	const handleFiles = (selected: FileList | File[]) => {
		files = new Set([
			...files,
			...Array.from(selected)
				.filter(
					(file) =>
						!files.values().find((i) => i.file.name === file.name && i.file.size === file.size)
				)
				.map((file) => new FileListItem(getNewFileId(), file))
		]);
	};

	const onDrop = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		dragActive = false;
		if (event.dataTransfer?.files) {
			handleFiles(event.dataTransfer.files);
		}
	};

	const onDragOver = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		console.debug(event);
		dragActive = (event.dataTransfer?.items.length ?? 0) > 0;
	};

	const onDragLeave = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		dragActive = false;
	};

	const onInput = (event: Event) => {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			handleFiles(input.files);
		}
	};
</script>

<div
	class={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 py-6 transition-all duration-400 sm:p-8 ${
		dragActive
			? 'border-blue-500 bg-zinc-100 dark:border-blue-600 dark:bg-zinc-800'
			: 'border-zinc-400 bg-zinc-200 hover:border-blue-600 dark:border-zinc-700 dark:bg-zinc-900 hover:dark:border-blue-800'
	}`}
	tabindex="0"
	role="button"
	aria-label="File upload dropzone"
>
	<input
		type="file"
		multiple
		class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
		onchange={onInput}
		ondragover={onDragOver}
		ondragleave={onDragLeave}
		ondrop={onDrop}
		tabindex="-1"
		aria-label="File upload"
	/>
	<div class="pointer-events-none flex flex-col items-center">
		<div class="mb-2 text-5xl">
			{#if dragActive}
				<ArrowDown />
			{:else}
				<Upload />
			{/if}
		</div>
		<div class="mb-1 text-center text-sm font-semibold sm:text-lg">
			<span class="hidden sm:inline">
				{m.dropzone_title({ dragActive, mobile: false })}
			</span>
			<span class="sm:hidden">
				{m.dropzone_title({ dragActive, mobile: true })}
			</span>
		</div>
		<div class="text-sm text-zinc-500 dark:text-zinc-400">{m.dropzone_subtitle()}</div>
	</div>
</div>
