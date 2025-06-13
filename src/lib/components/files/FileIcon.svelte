<script lang="ts">
	import {
		AppWindow,
		FileArchive,
		FileChartLine,
		FileChartPie,
		FileImage,
		FileMusic,
		FileQuestion,
		FileSpreadsheet,
		FileText,
		FileVideo
	} from '@lucide/svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		type: string;
	}

	let { type, ...props }: Props = $props();
</script>

<span {...props}>
	{#if type.startsWith('image/')}
		<FileImage />
	{:else if type.startsWith('video/')}
		<FileVideo />
	{:else if type.startsWith('audio/')}
		<FileMusic />
	{:else if type === 'application/pdf'}
		<FileChartLine />
	{:else if type.includes('zip') || type.includes('compressed')}
		<FileArchive />
	{:else if type.startsWith('text/') || type === 'application/msword' || type.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml')}
		<FileText />
	{:else if type === 'application/vnd.ms-excel' || type.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml')}
		<FileSpreadsheet />
	{:else if type === 'application/vnd.ms-powerpoint' || type.startsWith('application/vnd.openxmlformats-officedocument.presentationml')}
		<FileChartPie />
	{:else if type === 'application/x-msdownload'}
		<AppWindow />
	{:else}
		<FileQuestion />
	{/if}
</span>
