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
		class="w-64 rounded border border-zinc-500 bg-zinc-100 px-3 py-2 text-sm text-ellipsis dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
		readonly={url !== null}
		disabled={!url}
	/>
	<button
		class={[
			'ml-2 cursor-pointer rounded px-3 py-2 text-sm shadow transition-colors duration-500 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:text-zinc-600 disabled:dark:bg-zinc-700 disabled:dark:text-zinc-900',
			showCopyUrlSuccess
				? 'bg-green-500 text-green-950 dark:bg-green-600'
				: 'bg-blue-600 text-white not-disabled:hover:bg-blue-700 dark:bg-blue-800'
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
