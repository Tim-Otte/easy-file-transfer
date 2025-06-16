<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="container mx-auto p-8 pb-12">
	{@render children()}
</div>
