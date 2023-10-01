<script>
	import { fly } from 'svelte/transition'
	import { closing } from '../stores'

	export let thumb
	export let loaded

	const style = `background-image:url(${thumb})`
</script>

{#if !loaded}
	<div class="bp-load" out:fly|local={{ duration: 480 }} {style}>
		<span class="bp-bar" />
		<span class="bp-o" />
	</div>
{/if}

{#if $closing}
	<div class="bp-load" in:fly|global={{ duration: 480 }} {style} />
{/if}
