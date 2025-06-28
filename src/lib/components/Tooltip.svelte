<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		text: string;
		children: Snippet;
	};

	let { text, children }: Props = $props();
</script>

<div class="group relative inline-block">
	{@render children()}

	<div
		class="absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-xs -translate-x-1/2 scale-0 transform rounded-xl bg-neutral-800 px-3 py-2 text-sm text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100"
	>
		{text}
		<div class="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-neutral-800"></div>
	</div>
</div>
