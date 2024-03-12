<script>
	import { addAttributes } from '../stores'
	import Loading from './loading.svelte'

	export let props

	let loaded, dimensions

	const { activeItem } = props

	const setDimensions = () =>
		(dimensions = props.calculateDimensions(activeItem))

	setDimensions()

	props.setResizeFunc(setDimensions)

	const addSrc = (node) => {
		addAttributes(node, activeItem.attr)
		node.src = activeItem.iframe
	}
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
	<Loading {activeItem} {loaded} />
</div>
