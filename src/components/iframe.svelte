<script>
	import Loading from './loading.svelte'

	export let stuff

	let loaded

	let dimensions

	const { activeItem, calculateDimensions, setResizeFunc } = stuff

	const { iframe, thumb, title, width, height } = activeItem

	const setDimensions = () => (dimensions = calculateDimensions(width, height))

	setDimensions()

	setResizeFunc(setDimensions)

	// add src ourselves to avoid src_url_equal call (svelte stuff)
	const addSrc = (node) => (node.src = iframe)
</script>

<div
	class="bp-if"
	style="
		width:{dimensions[0]}px;
		height:{dimensions[1]}px
	"
>
	<iframe
		use:addSrc
		allow="autoplay; fullscreen"
		{title}
		on:load={() => (loaded = true)}
	/>
	<Loading {thumb} {loaded} />
</div>
