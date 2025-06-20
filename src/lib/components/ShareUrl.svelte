<script lang="ts">
	import { Check, Copy, Loader2 } from '@lucide/svelte';

	interface Props {
		url: string | null;
	}

	let { url }: Props = $props();
	let showCopyUrlSuccess = $state(false);

	const onCopyUrlClick = () => {
		if (url) {
			navigator.clipboard.writeText(url);
			showCopyUrlSuccess = true;
			setTimeout(() => {
				showCopyUrlSuccess = false;
			}, 2500);
		}
	};
</script>

<div>
	<input
		type="text"
		value={url?.replace(/http(s)?:\/\//, '') ?? 'Loading...'}
		class="w-64 rounded border border-gray-300 px-3 py-2 text-sm text-ellipsis dark:border-gray-600 dark:bg-zinc-800 dark:text-gray-200"
		readonly={url !== null}
		disabled={!url}
	/>
	<button
		class={[
			'ml-2 cursor-pointer rounded px-3 py-2 text-sm shadow transition-colors duration-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-900',
			showCopyUrlSuccess
				? 'bg-green-600 text-green-950'
				: 'bg-blue-800 text-white not-disabled:hover:bg-blue-700'
		]}
		onclick={onCopyUrlClick}
		disabled={!url}
		aria-label="Copy share URL"
	>
		{#if url}
			{#if showCopyUrlSuccess}
				<Check class="inline h-4 w-4" />
			{:else}
				<Copy class="inline h-4 w-4" />
			{/if}
		{:else}
			<Loader2 class="inline h-4 w-4 animate-spin" />
		{/if}
	</button>
</div>
