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
		dragActive = (event.dataTransfer?.files.length ?? 0) > 0;
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
	class={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 bg-white p-8 transition-all duration-400 dark:bg-zinc-900 ${
		dragActive ? 'border-blue-600 bg-blue-50' : 'border-zinc-700 hover:border-blue-800'
	}`}
	ondrop={onDrop}
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	tabindex="0"
	role="button"
	aria-label="File upload dropzone"
>
	<input
		type="file"
		multiple
		class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
		onchange={onInput}
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
		<div class="mb-1 text-lg font-semibold">
			{m.dropzone_title({ dragActive })}
		</div>
		<div class="text-sm text-gray-500 dark:text-gray-400">{m.dropzone_subtitle()}</div>
	</div>
</div>
