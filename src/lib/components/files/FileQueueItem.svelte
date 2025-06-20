<script lang="ts">
	import { FileIcon } from '$components';
	import { formatSize } from '$utils/file-size';
	import { type Icon as IconType } from '@lucide/svelte';
	import type { ClassValue } from 'svelte/elements';

	type ActionButton = {
		action: (id: string) => void;
		icon: typeof IconType;
		class: ClassValue;
	};

	type Props = {
		fileId: string;
		mimeType: string;
		name: string;
		size: number;
		actionButton: ActionButton | null;
	};

	let { fileId, mimeType, name, size, actionButton }: Props = $props();
</script>

<div
	class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 shadow dark:border-gray-700 dark:bg-zinc-700"
>
	<FileIcon type={mimeType} class="mr-1 text-2xl text-zinc-400" />
	<div class="min-w-0 flex-1">
		<div class="truncate font-medium">{name}</div>
		<div class="text-xs text-gray-500 dark:text-gray-400">
			{formatSize(size)}
		</div>
	</div>
	{#if actionButton}
		<button
			class={`cursor-pointer rounded p-2 transition-colors duration-200 hover:bg-zinc-800 ${actionButton.class}`}
			onclick={() => actionButton.action(fileId)}
			aria-label="Download file"
		>
			<svelte:boundary>
				{@const ActionIcon = actionButton.icon}
				<ActionIcon class="size-5 text-center" />
			</svelte:boundary>
		</button>
	{/if}
</div>
