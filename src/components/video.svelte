<script>
	/*
	This could be cleaner with svelte:element to switch video / audio
	and each blocks for sources / tracks, but doing it that way creates
	a larger vanilla bundle size, so we make them ourselves.
	*/

	import Loading from './loading.svelte'
	import { addAttributes, getThumbBackground } from '../stores'

	export let props

	let loaded, dimensions

	const { activeItem, opts, container } = props

	const setDimensions = () =>
		(dimensions = props.calculateDimensions(activeItem))

	setDimensions()

	props.setResizeFunc(setDimensions)

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
					mediaElement = document.createElement(
						obj.type?.includes('audio') ? 'audio' : 'video'
					)
					addAttributes(mediaElement, {
						controls: true,
						autoplay: true,
						playsinline: true,
						tabindex: '0',
					})
					addAttributes(mediaElement, activeItem.attr)
				}
				// add sources / tracks to media element
				const el = document.createElement(tag)
				addAttributes(el, obj)
				if (tag == 'source') {
					el.onError = (error) => opts.onError?.(container, activeItem, error)
				}
				mediaElement.append(el)
			}
		}
		appendToVideo('source', activeItem.sources)
		appendToVideo('track', activeItem.tracks || [])
		mediaElement.oncanplay = () => (loaded = true)
		node.append(mediaElement)
	}
</script>

<div
	class="bp-vid"
	use:onMount
	style:background-image={getThumbBackground(activeItem)}
	style="
			width:{dimensions[0]}px;
			height:{dimensions[1]}px;
		"
>
	<Loading {activeItem} {loaded} />
</div>
