<script>
	import Loading from './loading.svelte'

	export let props

	let loaded, dimensions

	const { activeItem } = props

	const setDimensions = () =>
		(dimensions = props.calculateDimensions(activeItem))

	setDimensions()

	props.setResizeFunc(setDimensions)

	// add src ourselves to avoid src_url_equal call (svelte stuff)
	const addSrc = (node) => (node.src = activeItem.iframe)
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
		title={activeItem.title}
		on:load={() => (loaded = true)}
	/>
	<Loading thumb={activeItem.thumb} {loaded} />
</div>
