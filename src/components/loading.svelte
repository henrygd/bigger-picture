<script>
	import { fly } from 'svelte/transition'
	import { closing, getThumbBackground } from '../stores'

	export let activeItem
	export let loaded
</script>

{#if !loaded}
	<div
		class="bp-load"
		out:fly|local={{ duration: 480 }}
		style:background-image={getThumbBackground(activeItem)}
	>
		<span class="bp-bar" />
		<span class="bp-o" />
	</div>
{/if}

{#if $closing}
	<div
		class="bp-load"
		in:fly|global={{ duration: 480 }}
		style:background-image={getThumbBackground(activeItem)}
	/>
{/if}
