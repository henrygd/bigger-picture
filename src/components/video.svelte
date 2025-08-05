<script>
	/*
	This could be cleaner with svelte:element to switch video / audio
	and each blocks for sources / tracks, but doing it that way creates
	a larger vanilla bundle size, so we make them ourselves.
	*/

	import Loading from './loading.svelte';
	import { addAttributes, getThumbBackground } from '../stores';

	export let props;
	export let activeDimensions;

	let loaded = false;

	const { activeItem, opts, container } = props;

	/** create audio / video element */
	const onMount = (node) => {

		let mediaElement;

		/** takes supplied object and creates elements in video */
		const appendToVideo = (tag, list) => {
			if (!Array.isArray(list)) {
				list = JSON.parse(list)
			}
			for (let item of list) {
				// create media element if it doesn't exist
				if (!mediaElement) {
					mediaElement = document.createElement(item.type?.includes('audio') ? 'audio' : 'video');
					addAttributes(mediaElement, {
						controls: true, autoplay: true, playsinline: true, tabindex: '0'
					});
					addAttributes(mediaElement, activeItem.attr);
				}
				// add sources / tracks to media element
				let el = document.createElement(tag);
				addAttributes(el, item);
				if (tag === 'source') {
					el.onError = (error) => opts.onError?.(container, activeItem, error);
				}
				mediaElement.append(el);
			}
		};

		appendToVideo('source', activeItem.sources);

		if (activeItem.tracks) {
			appendToVideo('track', activeItem.tracks);
		}

		mediaElement.oncanplay = () => (loaded = true);

		node.append(mediaElement);

	};
</script>

<div
	class="bp-video"
	use:onMount
	style:width="{activeDimensions[0]}px"
	style:height="{activeDimensions[1]}px"
	style:background-image={getThumbBackground(activeItem)}
>
	<Loading {activeItem} {loaded} />
</div>
