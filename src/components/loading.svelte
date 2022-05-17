<script>
	import { fly } from 'svelte/transition'
	import { closing } from '../stores'

	export let thumb
	export let loaded
</script>

{#if !loaded || $closing}
	<div
		class="bp-load"
		in:fly={{ duration: loaded ? 400 : 0 }}
		out:fly|local={{ duration: 480 }}
		style="background-image:url({thumb})"
	>
		{#if !$closing}
			<span class="bp-bar" />
			<span class="bp-o" />
		{/if}
	</div>
{/if}
