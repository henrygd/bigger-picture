<script>
	import { fade } from 'svelte/transition'
	import { closing } from '../stores'

	export let thumb
	export let loaded
</script>

{#if !loaded || $closing}
	<div
		class="bp-load"
		in:fade={{ duration: loaded ? 300 : 0 }}
		out:fade|local={{ duration: 200 }}
		style="background-image:url({thumb})"
	>
		{#if !$closing}
			<span class="bp-bar" />
			<span class="bp-o" />
		{/if}
	</div>
{/if}
