<script lang="ts">
	import { FileIcon } from '$components';
	import { formatSize } from '$utils/file-size';
	import { formatSpeed } from '$utils/transfer-speed';
	import { Gauge, Hash, Save, type Icon as IconType } from '@lucide/svelte';
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
		hash?: string;
	};

	let {
		fileId,
		mimeType,
		name,
		size,
		actionButton,
		progress,
		speed,
		class: itemClass,
		hash
	}: Props = $props();
</script>

{#snippet badge(
	icon: typeof IconType,
	text: string,
	badgeClass?: ClassValue,
	textClass?: ClassValue
)}
	{@const BadgeIcon = icon}
	<div
		class={[
			'flex items-center gap-1 overflow-hidden rounded bg-neutral-200 px-1 py-0.5 whitespace-nowrap text-neutral-800 sm:gap-1.5 sm:rounded-full sm:px-3 sm:py-1.5 dark:bg-neutral-600 dark:text-neutral-200',
			badgeClass
		]}
	>
		<BadgeIcon
			class="inline size-3 text-neutral-700 sm:size-4 dark:text-neutral-300"
			strokeWidth="2"
		/>
		<span class={textClass}>{text}</span>
	</div>
{/snippet}

<div
	class="relative flex items-center gap-3 rounded-lg {speed
		? 'border-t'
		: 'border'} border-neutral-300 bg-neutral-200 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-700 {itemClass}"
>
	<FileIcon type={mimeType} class="mr-1 text-2xl text-neutral-600 dark:text-neutral-400" />
	<div class="flex min-w-0 flex-1 flex-col sm:flex-row">
		<div class="truncate p-1 font-medium">{name}</div>
		<div
			class="flex items-center gap-1 overflow-hidden text-xs/tight text-neutral-500 sm:ml-8 sm:gap-3 dark:text-neutral-400"
		>
			{@render badge(Save, formatSize(size), hash && 'not-sm:hidden')}
			{#if speed}
				{@render badge(Gauge, formatSpeed(speed), 'sm:hidden')}
			{/if}
			{#if hash}
				{@render badge(Hash, hash, undefined, 'truncate font-mono')}
			{/if}
		</div>
	</div>
	{#if speed !== undefined}
		<div
			class="rounded bg-neutral-100 p-2 text-xs text-neutral-700 not-sm:hidden dark:bg-neutral-600 dark:text-neutral-300"
		>
			<Gauge
				size="16"
				class="mr-1 inline align-text-bottom text-neutral-700 dark:text-neutral-300"
			/>
			{formatSpeed(speed)}
		</div>
		<div
			class="absolute right-0 bottom-0 left-0 h-1 rounded-b-lg bg-neutral-200 dark:bg-neutral-600"
		>
			<div
				class="h-full rounded-lg bg-green-500 transition-all duration-500 dark:bg-green-800"
				style="width: {progress?.toFixed(0) ?? 0}%;"
			></div>
		</div>
	{:else if actionButton}
		<button
			class={`cursor-pointer rounded p-2 transition-colors duration-200 not-disabled:hover:bg-neutral-300 not-disabled:hover:dark:bg-neutral-800 ${actionButton.class} disabled:cursor-not-allowed disabled:text-neutral-500`}
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
