<script lang="ts">
	import { m } from '$messages';
	import { isMobile } from '$utils/mobile-check';
	import { Check, Copy, Loader2, Share2 } from '@lucide/svelte';

	interface Props {
		url: string | null;
	}

	let { url }: Props = $props();
	let showCopyUrlSuccess = $state(false);
	const iconClass = 'inline h-4 w-4';

	const onCopyUrlClick = () => {
		if (url) {
			// If on mobile and navigator.share is available, use the share functionality
			if (isMobile() && typeof navigator.share === 'function') {
				navigator
					.share({
						title: m.share_url(),
						text: m.share_url_text(),
						url: url
					})
					.catch((error) => {
						console.error('Error sharing:', error);
					});
			}
			// Else, copy the URL to clipboard
			else {
				navigator.clipboard.writeText(url);
				showCopyUrlSuccess = true;
				setTimeout(() => {
					showCopyUrlSuccess = false;
				}, 2500);
			}
		}
	};
</script>

<div>
	<input
		type="text"
		value={url?.replace(/http(s)?:\/\//, '') ?? 'Loading...'}
		class="hidden w-64 rounded border border-neutral-500 bg-neutral-100 px-3 py-2 text-sm text-ellipsis sm:inline-block dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200"
		readonly={url !== null}
		disabled={!url}
	/>
	<button
		class={[
			'ml-2 cursor-pointer rounded px-3 py-2 text-sm shadow transition-colors duration-500 disabled:cursor-not-allowed disabled:bg-neutral-400 disabled:text-neutral-600 disabled:dark:bg-neutral-700 disabled:dark:text-neutral-900',
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
				<Check class={iconClass} />
			{:else}
				<Copy class="{iconClass} not-sm:hidden" />
				<Share2 class="{iconClass} sm:hidden" />
			{/if}
		{:else}
			<Loader2 class="{iconClass} animate-spin" />
		{/if}
	</button>
</div>
