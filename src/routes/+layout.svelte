<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="container p-8 mx-auto">
	{@render children()}
</div>
