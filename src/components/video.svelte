<script>
	/*
	This could be cleaner with svelte:element to switch video / audio
	and each blocks for sources / tracks, but doing it that way creates
	a larger vanilla bundle size, so we make them ourselves.
	*/

	import Loading from './loading.svelte'
	import { attr, element, append, listen } from 'svelte/internal'

	export let stuff

	let loaded, dimensions

	let { activeItem, calculateDimensions, setResizeFunc } = stuff

	let { sources, thumb, tracks = [], width, height } = activeItem

	const setDimensions = () => (dimensions = calculateDimensions(width, height))

	setDimensions()

	setResizeFunc(setDimensions)

	const audio = JSON.stringify(sources).includes('audio')

	// adds attributes to a node
	const addAttributes = (node, obj) => {
		Object.keys(obj).forEach((key) => attr(node, key, obj[key]))
	}

	const onMount = (node) => {
		// create audo / video element
		const mediaElement = element(audio ? 'audio' : 'video')
		// add attributes to created elements
		addAttributes(mediaElement, {
			controls: true,
			autoplay: true,
			playsinline: true,
			tabindex: '0',
		})

		// takes supplied object and creates elements in video
		const appendToVideo = (tag, arr) => {
			if (!Array.isArray(arr)) {
				arr = JSON.parse(arr)
			}
			// add attributes
			arr.forEach((obj) => {
				const el = element(tag)
				addAttributes(el, obj)
				append(mediaElement, el)
			})
		}
		appendToVideo('track', tracks)
		appendToVideo('source', sources)
		listen(mediaElement, 'canplay', () => (loaded = true))
		node.prepend(mediaElement)
	}
</script>

<div
	class="bp-vid"
	use:onMount
	style="
			width:{dimensions[0]}px;
			height:{dimensions[1]}px;
			background-image:url({thumb})
		"
>
	<Loading {thumb} {loaded} />
</div>
