<script>
	import { fly } from 'svelte/transition';
	import { closing, getThumbBackground } from '../stores';
	import { defaultTweenOptions } from '../stores.js';

	export let activeItem;
	export let loaded;
</script>

{#if !loaded}
	<div
		class="bp-load"
		out:fly|local={defaultTweenOptions(500)}
		style:background-image={getThumbBackground(activeItem)}
	>
		<span class="bp-bar"></span>
		<span class="bp-o"></span>
	</div>
{/if}

{#if $closing}
	<div
		class="bp-load"
		in:fly|global={defaultTweenOptions(500)}
		style:background-image={getThumbBackground(activeItem)}
	></div>
{/if}
