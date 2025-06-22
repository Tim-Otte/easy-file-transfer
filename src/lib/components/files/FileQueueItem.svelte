<script lang="ts">
	import { FileIcon } from '$components';
	import { formatSize } from '$utils/file-size';
	import { formatSpeed } from '$utils/transfer-speed';
	import { Gauge, type Icon as IconType } from '@lucide/svelte';
	import type { ClassValue } from 'svelte/elements';

	type ActionButton = {
		action: (id: string) => void;
		icon: typeof IconType;
		class: ClassValue;
		disabled?: boolean;
	};

	type Props = {
		fileId: string;
		mimeType: string;
		name: string;
		size: number;
		actionButton: ActionButton | null;
		progress?: number;
		speed?: number;
		class?: ClassValue;
	};

	let {
		fileId,
		mimeType,
		name,
		size,
		actionButton,
		progress,
		speed,
		class: itemClass
	}: Props = $props();
</script>

<div
	class="relative flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 shadow dark:border-gray-700 dark:bg-zinc-700 {itemClass}"
>
	<FileIcon type={mimeType} class="mr-1 text-2xl text-zinc-400" />
	<div class="min-w-0 flex-1">
		<div class="truncate font-medium">{name}</div>
		<div class="text-xs text-gray-500 dark:text-gray-400">
			{formatSize(size)}
		</div>
	</div>
	{#if speed !== undefined}
		<div class="rounded bg-zinc-200 p-2 text-xs text-zinc-300 dark:bg-zinc-600">
			<Gauge size="16" class="mr-1 inline align-text-bottom text-zinc-500 dark:text-zinc-300" />
			{formatSpeed(speed)}
		</div>
		<div class="absolute right-0 bottom-0 left-0 h-1 rounded-b-lg bg-zinc-200 dark:bg-zinc-600">
			<div
				class="h-full rounded-lg bg-green-800 transition-all duration-500"
				style="width: {progress?.toFixed(0) ?? 0}%;"
			></div>
		</div>
	{:else if actionButton}
		<button
			class={`cursor-pointer rounded p-2 transition-colors duration-200 not-disabled:hover:bg-zinc-800 ${actionButton.class} disabled:cursor-not-allowed disabled:text-zinc-500`}
			onclick={() => actionButton.action(fileId)}
			disabled={actionButton.disabled}
			aria-label="Download file"
		>
			<svelte:boundary>
				{@const ActionIcon = actionButton.icon}
				<ActionIcon class="size-5 text-center" />
			</svelte:boundary>
		</button>
	{/if}
</div>
