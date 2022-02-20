<script>
	import Loading from './loading.svelte'

	export let activeItem
	export let calculateDimensions

	let loaded

	let { iframe, thumb, title } = activeItem

	let dimensions

	const updateDimensions = () => {
		dimensions = calculateDimensions(activeItem.width, activeItem.height)
	}

	updateDimensions()
</script>

<svelte:window on:resize={updateDimensions} />

<div
	class="bp-item bp-if"
	style="
		width:{dimensions[0]}px;
		height:{dimensions[1]}px
	"
>
	<iframe
		allow="autoplay; fullscreen"
		src={iframe}
		{title}
		on:load={() => (loaded = true)}
	/>
	<Loading {thumb} {loaded} />
</div>
