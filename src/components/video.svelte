<script>
	/*
	This could be cleaner with svelte:element to switch video / audio
	and each blocks for sources / tracks, but doing it that way creates
	a larger vanilla bundle size, so we make them ourselves.
	*/

	import Loading from './loading.svelte'
	import { attr, element, append, listen } from 'svelte/internal'

	export let props

	let loaded, dimensions

	const { activeItem } = props

	const setDimensions = () =>
		(dimensions = props.calculateDimensions(activeItem))

	setDimensions()

	props.setResizeFunc(setDimensions)

	/** adds attributes to a node */
	const addAttributes = (node, obj) => {
		for (const key in obj) {
			attr(node, key, obj[key])
		}
	}

	/** create audo / video element */
	const onMount = (node) => {
		let mediaElement

		/** takes supplied object and creates elements in video */
		const appendToVideo = (tag, arr) => {
			if (!Array.isArray(arr)) {
				arr = JSON.parse(arr)
			}
			for (const obj of arr) {
				// create media element if it doesn't exist
				if (!mediaElement) {
					mediaElement = element(
						obj.type?.includes('audio') ? 'audio' : 'video'
					)
					addAttributes(mediaElement, {
						controls: true,
						autoplay: true,
						playsinline: true,
						tabindex: '0',
					})
				}
				// add sources / tracks to media element
				const el = element(tag)
				addAttributes(el, obj)
				append(mediaElement, el)
			}
		}
		appendToVideo('source', activeItem.sources)
		appendToVideo('track', activeItem.tracks || [])
		listen(mediaElement, 'canplay', () => (loaded = true))
		append(node, mediaElement)
	}
</script>

<div
	class="bp-vid"
	use:onMount
	style="
			width:{dimensions[0]}px;
			height:{dimensions[1]}px;
			background-image:url({activeItem.thumb})
		"
>
	<Loading thumb={activeItem.thumb} {loaded} />
</div>
