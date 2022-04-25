<script>
	import Loading from './loading.svelte'

	export let stuff

	let { activeItem, calculateDimensions, setResizeFunc } = stuff

	let { iframe, thumb, title, width, height } = activeItem

	let loaded

	let dimensions

	const setDimensions = () => (dimensions = calculateDimensions(width, height))

	setDimensions()

	setResizeFunc(setDimensions)
</script>

<div
	class="bp-if"
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
