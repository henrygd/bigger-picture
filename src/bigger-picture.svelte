<svelte:options accessors={true} />

<script>
	import { closing, defaultTweenOptions } from './stores';
	import { writable } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import Thumbs from './components/thumbs.svelte';
	import ImageItem from './components/image.svelte';
	import Iframe from './components/iframe.svelte';
	import Video from './components/video.svelte';

	/**
	 * Items in the gallery
	 */
	export let items = undefined;

	/** element the gallery is mounted within (passed during initialization)*/
	export let target = undefined

	const html = document.documentElement;

	/** index of current active item */
	let position = 0;

	/** options passed via open method */
	let opts;

	/** bool tracks open state */
	let isOpen;

	/** dom element to restore focus to on close */
	let focusTrigger;

	/** bool true if container width < 769 */
	let smallScreen;

	/** bool value of inline option passed in open method */
	let inline;

	/** when position is set */
	let movement;

	/** stores target on pointerdown (ref for overlay close) */
	let clickedEl;

	let ruler;
	let container;
	let containerWidth;
	let containerHeight;

	/** active item object */
	let activeItem = null;
	let activeDimensions;

	// /** true if image is currently zoomed past starting size */
	const zoomed = writable(0);

	/**
	 * Update the active item and dimensions on position change
	 */
	$: if (items && items[position]) {
		activeItem = items[position];
		activeDimensions = calculateDimensions(activeItem);
		if (isOpen) {
			opts.onUpdate?.(container, activeItem);
		}
	}

	/** receives options and opens gallery */
	export const open = (options) => {
		opts = options;
		inline = opts.inline;

		/**
		 * Lock the scroll unless gallery is inline
		 */
		if (!inline && html.scrollHeight > html.clientHeight) {
			html.classList.add('bp-lock');
		}

		/**
		 * Update trigger element to restore focus
		 */
		focusTrigger = document.activeElement;

		if (target) {
			container = target;
			containerWidth = target.offsetWidth;
			containerHeight = target === document.body ? window.innerHeight : target.clientHeight;
		}

		position = opts.position || 0;

		/**
		 * Set the gallery items
		 */
		const list = [];

		if (opts.items instanceof HTMLElement) {
			opts.items = [opts.items];
		} else {
			opts.items = Array.from(opts.items);
		}

		opts.items.forEach((item, i) => {

			item = prepareItem(item);

			if (typeof item !== 'object') {
				return;
			}

			item.i = i;

			if (opts.el && opts.el === item.element) {
				position = i;
			}

			list.push(item);

		});

		items = list;

	};

	/**
	 * Close the gallery
	 */
	export const close = () => {
		opts.onClose?.(container, activeItem);
		closing.set(true);
		items = null;
		focusTrigger?.focus({ preventScroll: true });
	};

	/**
	 * Switch to the previous item
	 */
	export const prev = () => setPosition(position - 1);

	/**
	 * Switch to the next item
	 */
	export const next = () => setPosition(position + 1);

	/**
	 * Jump to a specific position
	 *
	 * @param {number} index
	 */
	export const setPosition = (index) => {
		movement = index - position;
		position = getNextPosition(index);
	};

	/**
	 * Get the next gallery position
	 *
	 * @param {number} index
	 */
	const getNextPosition = (index) => (index + items.length) % items.length;

	/**
	 * Handle the keyboard events
	 *
	 * @param e
	 *
	 * @returns {Object|false}
	 */
	const onKeydown = (e) => {
		const { key, shiftKey } = e;
		if (key === 'Escape') {
			!opts.noClose && close();
		} else if (key === 'ArrowRight') {
			next();
		} else if (key === 'ArrowLeft') {
			prev();
		} else if (key === 'Tab') {
			/**
			 * Trap the focus on tab press
			 */
			const { activeElement } = document;

			/**
			 * Allow browser to handle tab into video controls only
			 */
			if (shiftKey || !activeElement.controls) {
				e.preventDefault();
				const { focusWrap = container } = opts;
				const tabbable = [...focusWrap.querySelectorAll('*')].filter((node) => node.tabIndex >= 0);
				let index = tabbable.indexOf(activeElement);
				index += tabbable.length + (shiftKey ? -1 : 1);
				tabbable[index % tabbable.length].focus();
			}
		}
	};

	/**
	 * Normalize a gallery item
	 *
	 * @param {Object} item
	 */
	const prepareItem = (item) => {

		if (item instanceof HTMLElement) {
			item = {
				element: item,
				...item.dataset
			};
		}

		item.attr = item.attr || {};

		['link', 'thumb', 'iframe', 'html', 'img', 'sources', 'caption', 'alt', 'fit', 'attr'].forEach(key => {
			if (typeof item[key] === 'function') {
				item[key] = item[key](item);
			}
		});

		if (item.sources && typeof item.sources === 'string') {
			item.sources = JSON.parse(item.sources);
		}

		if (item.sources) {
			item.type = 'video';
		} else if (item.iframe) {
			item.type = 'iframe';
		} else if (item.img) {
			item.type = 'image';
		} else if (item.html) {
			item.type = 'html';
		} else {
			let link = item.element?.link || item.element?.href || '';
			if (link) {
				item = parseLink(link, item);
			} else {
				return false;
			}
		}

		if (opts.types && opts.types.indexOf(item.type) === -1) {
			return false;
		} else {
			return parseThumbnail(item);
		}

	};

	/**
	 * Parse the link and detect the content type
	 *
	 * @param {string} link
	 * @param {Object} item
	 *
	 * @returns {Object}
	 */
	const parseLink = (link, item) => {

		let match = link.match(/\.(?:jpe?g|png|gif|bmp|webp|avif|svg|tiff|ico)(?:[\?#].*)?$/i);

		if (match) {
			item.type = 'image';
			item.img = link;
			return item;
		}

		/**
		 * HTML5 Video
		 */
		match = link.match(/\.(mp4|mpeg|mov|ogv|webm|avi|h264)((\?|#).*)?$/i);

		if (match) {

			item.type = 'video';

			let ext = match[1].toLowerCase();
			let mimeMap = {
				ogv: 'ogg',
				mov: 'quicktime',
				avi: 'x-msvideo'
			};

			item.sources = [{
				'src': link,
				'type': 'video/' + (mimeMap[ext] || ext)
			}];

			return item;

		}

		/**
		 * HTML5 Audio
		 */
		match = link.match(/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|wma|weba|mid)((\?|#).*)?$/i);

		if (match) {
			let ext = match[1].toLowerCase();
			let mimeMap = {
				mp3: 'mpeg',
				m4a: 'mp4',
				oga: 'ogg',
				opus: 'ogg',
				mid: 'midi',
				weba: 'webm'
			};
			item.type = 'video';
			item.sources = [{
				src: link,
				type: 'audio/' + (mimeMap[ext] || ext)
			}];
		}

		/**
		 * YouTube Video
		 */
		match = link.match(/(youtube\.com|youtu\.be)\/(?:watch\?(?:.*&)?v=|v\/|u\/|shorts\/|embed\/?)?(videoseries\?list=(?:.*)|[\w-]{11}|\?listType=(?:.*)&list=(?:.*))(?:.*)/i);

		if (match) {

			let videoID = encodeURIComponent(match[2]),
				sourceURL = new URL(link),
				targetURL = new URL('https://www.youtube.com/embed/' + videoID + '?autoplay=1&playsinline=1&controls=1&rel=0');

			sourceURL.searchParams.delete('v');

			for (let [key, value] of sourceURL.searchParams) {
				if (key === 't') {
					let timeMatch = value.match(/((\d*)m)?(\d*)s?/);
					if (timeMatch) {
						key = 'start';
						value = 60 * parseInt(timeMatch[2] || '0') + parseInt(timeMatch[3] || '0');
					}
				}
				targetURL.searchParams.set(key, value);
			}

			item.type = 'iframe';
			item.iframe = targetURL.toString();
			item.preview = 'https://i.ytimg.com/vi/' + videoID + '/mqdefault.jpg';

			return item;

		}

		/**
		 * Vimeo Video
		 */
		match = link.match(/^.+vimeo.com\/(?:\/)?(video\/)?([\d]+)((\/|\?h=)([a-z0-9]+))?(.*)?/);

		if (match) {

			let videoID = encodeURIComponent(match[2]),
				sourceURL = new URL(link),
				targetURL = new URL('https://player.vimeo.com/video/' + videoID + '?autoplay=1&playsinline=1');

			for (let [key, value] of sourceURL.searchParams) {
				targetURL.searchParams.set(key, value);
			}

			if (match[5]) {
				targetURL.searchParams.set('h', match[5]);
			} else {
				item.preview = 'https://vumbnail.com/' + videoID + '.jpg';
			}

			if (sourceURL.hash && sourceURL.hash.startsWith('#t=')) {
				targetURL.hash = sourceURL.hash;
			}

			item.type = 'iframe';
			item.iframe = targetURL.toString();

			return item;

		}

		/**
		 * SoundCloud Widget
		 */
		match = link.match(/^(https?:\/\/)?(www\.)?(m\.)?soundcloud\.com\/([a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+.*)$/);

		if (match) {

			let targetURL = new URL('https://w.soundcloud.com/player/?auto_play=1&visual=1&hide_related=1&show_comments=0');

			targetURL.searchParams.set('url', link);

			item.type = 'iframe';
			item.iframe = targetURL.toString();

			return item;

		}

		/**
		 * Google Drive, Dropbox, and PDF files
		 */
		match = link.match(/(drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+))|(dropbox\.com\/s\/)|(\.pdf($|\?|#))/i);

		if (match) {

			if (match[1] && match[2]) {
				// Google Drive
				item.iframe = `https://drive.google.com/file/d/${match[2]}/preview`;
			} else if (match[3]) {
				// Dropbox
				const url = new URL(link);
				url.searchParams.set('raw', '1');
				url.searchParams.delete('dl');
				item.iframe = url.toString();
			} else if (match[4]) {
				// PDF Files
				item.iframe = link;
			}

			if (!item.width || !item.height) {
				item.width = containerWidth;
				item.height = containerHeight;
			}

		}

		return item;

	};

	/**
	 * Parse a thumbnail, update dimensions, and the fit option
	 *
	 * @param {Object} item
	 */
	const parseThumbnail = (item) => {

		let thumbElement = false;

		if (item.thumb instanceof HTMLImageElement) {
			thumbElement = item.thumb;
		} else if (item.element) {
			thumbElement = item.element.querySelector('img');
		}

		if (thumbElement) {

			if (!item.fit) {
				item.fit = window.getComputedStyle(thumbElement).objectFit;
			}

			if (!item.thumb || item.thumb === thumbElement.src) {
				item.thumb = thumbElement.src;
				setDimensions(item, thumbElement);
			}

			return item;

		}

		let thumbLink = item.thumb || item.preview;

		if (thumbLink) {
			thumbElement = new Image();
			thumbElement.src = thumbLink;
			thumbElement.onload = () => {
				setDimensions(item, thumbElement);
			};
		}

		return item;

	};

	/**
	 * Set item dimensions based on a thumbnail image if not already specified
	 *
	 * @param {Object} item Gallery item object to check and update
	 * @param {HTMLImageElement} thumb Thumbnail image element to extract dimensions from
	 */
	const setDimensions = (item, thumb) => {

		if (thumb instanceof HTMLImageElement && (!item.width || !item.height)) {

			let dimensions = calculateDimensions({
				width: thumb.naturalWidth,
				height: thumb.naturalHeight
			});

			item.width = dimensions[0];
			item.height = dimensions[1];
			item.scaled = 1;

			activeDimensions = dimensions;

		}

	};

	/**
	 * Calculate width and height to fit inside a container
	 *
	 * @param {object} item object with height / width properties
	 * @returns {Array} [width: number, height: number]
	 */
	const calculateDimensions = ({ width = 1920, height = 1080 }) => {
		const activeGap = container ? parseInt(window.getComputedStyle(container).getPropertyValue('--bp-stage-gap')) : 0;
		const { scale = 1 } = opts
		const ratio = Math.min(
			((containerWidth - 2 * activeGap) / width) * scale,
			((containerHeight - 2 * activeGap) / height) * scale
		)
		// round number so we don't use a float as the sizes attribute
		return [Math.round(width * ratio), Math.round(height * ratio)]
	}

	/** preloads images for previous and next items in gallery */
	const preloadNext = () => {
		if (items) {
			const nextItem = items[getNextPosition(position + 1)];
			const prevItem = items[getNextPosition(position - 1)];
			!nextItem.preload && loadImage(nextItem);
			!prevItem.preload && loadImage(prevItem);
		}
	};

	/**
	 * Load and decode the image for an item
	 *
	 * @param {Object} item
	 */
	const loadImage = (item) => {

		if (item.img) {

			let image = document.createElement('img'),
				src = decodeURIComponent(item.img),
				srcset = '';

			if (/\s+\d+[wx]/.test(src)) {

				let match = '',
					parts = Array.from(src.matchAll(/(\S+)\s+(\d+)([wx])/gi), match => ({
						url: match[1],
						value: parseInt(match[2]),
						type: match[3]
					}));

				srcset = src;

				if (parts.length > 1) {
					if (parts[0].type === 'w') {
						parts.sort((a, b) => a.value - b.value);
						match = parts.find(c => c.value >= containerWidth) || parts[parts.length - 1];
					} else {
						let dpr = window.devicePixelRatio || 1;
						match = parts.find(c => c.value >= dpr) || parts[parts.length - 1];
					}
				}

				if (!match && parts[0]) {
					match = parts[0];
				}

				if (match && match.url) {
					image.src = match.url;
					item.attr.src = match.url;
				} else {
					image.srcset = srcset
				}

				image.sizes = opts.sizes || `${calculateDimensions(item)[0]}px`;
				item.attr.sizes = image.sizes;
				item.attr.srcset = srcset

			} else {
				image.src = src;
				item.attr.src = src;
			}

			image.preload = true;

			return image.decode().then(() => {

				if (item.scaled && image.naturalWidth > 0 && image.naturalHeight > 0) {
					item.width = image.naturalWidth;
					item.height = image.naturalHeight;
				}

				/**
				 * It's important to set srcset after we read the image dimensions
				 */
				if (image.src && srcset) {
					image.srcset = srcset;
				}

			}).catch((error) => {});

		}
	};

	/** svelte transition to control opening / changing */
	const mediaTransition = (node, isEntering) => {
		if (!isOpen || !items) {
			// entrance / exit transition
			isOpen = isEntering;
			return opts.intro ? fly(node, { y: isEntering ? 10 : -10 }) : scaleIn(node);
		}
		// forward / backward transition
		return fly(node, {
			...defaultTweenOptions(250),
			x: (movement > 0 ? 20 : -20) * (isEntering ? 1 : -1)
		});
	};

	/** custom svelte transition for entrance zoom */
	const scaleIn = (node) => {
		let dimensions;
		let css;

		/**
		 * Update the container dimensions before triggering an animation
		 */
		if (ruler) {
			containerWidth = ruler.clientWidth;
			containerHeight = ruler.clientHeight;
		}

		if (!activeItem.img && !activeItem.sources && !activeItem.iframe) {
			const bpItem = node.firstChild.firstChild;
			dimensions = [bpItem.clientWidth, bpItem.clientHeight];
		} else {
			dimensions = activeDimensions;
		}

		// rect is bounding rect of trigger element
		const rect = (activeItem.element || focusTrigger).getBoundingClientRect();
		const leftOffset = rect.left - (containerWidth - rect.width) / 2;
		const centerTop = rect.top - (containerHeight - rect.height) / 2;
		const scaleWidth = rect.width / dimensions[0];
		const scaleHeight = rect.height / dimensions[1];

		if (activeItem.fit === 'cover') {
			const scale = Math.max(scaleHeight, scaleWidth),
				offsetVertical = Math.max((dimensions[1] - rect.height / scale) / 2, 0),
				offsetHorizontal = Math.max((dimensions[0] - rect.width / scale) / 2, 0);
			css = (t, u) => {
				return `transform: translate3d(${leftOffset * u}px, ${centerTop * u}px, 0) scale3d(${scale + t * (1 - scale)}, ${scale + t * (1 - scale)}, 1);
				--bp-clip-y: ${offsetVertical * u}px;
				--bp-clip-x: ${offsetHorizontal * u}px;`;
			};
		} else if (activeItem.fit === 'contain') {
			const scale = Math.min(scaleHeight, scaleWidth);
			css = (t, u) => {
				return `transform: translate3d(${leftOffset * u}px, ${centerTop * u}px, 0) scale3d(${scale + t * (1 - scale)}, ${scale + t * (1 - scale)}, 1);`;
			};
		} else {
			css = (t, u) => {
				return `transform: translate3d(${leftOffset * u}px, ${centerTop * u}px, 0) scale3d(${scaleWidth + t * (1 - scaleWidth)}, ${scaleHeight + t * (1 - scaleHeight)}, 1);`;
			};
		}

		return {
			...defaultTweenOptions(500),
			css: css
		};
	};

	/** provides object w/ needed funcs / data to child components  */
	const getChildProps = () => ({
		calculateDimensions,
		preloadNext,
		activeItem,
		loadImage,
		container,
		zoomed,
		close,
		opts,
		prev,
		next
	});

	/**
	 * Process the gallery mount and destroy
	 */
	const containerActions = (node) => {
		container = node;
		opts.onOpen?.(container, activeItem);

		// don't use keyboard events for inline galleries
		if (!inline) {
			window.addEventListener('keydown', onKeydown);
		}

		return {
			destroy() {
				window.removeEventListener('keydown', onKeydown);
				closing.set(false);
				// remove class hiding scroll
				html.classList.remove('bp-lock');
				opts.onClosed?.();
			}
		};
	};

	$: smallScreen = containerWidth < 769;

	/**
	 * Ruler is required to get accurate dimensions and handle container resize
	 */
	const rulerActions = (node) => {

		ruler = node;

		const rulerObserver = new ResizeObserver((entries) => {

			const rect = entries[0].contentRect;

			if (rect.width !== containerWidth || rect.height !== containerHeight) {
				containerWidth = rect.width;
				containerHeight = rect.height;
				activeDimensions = calculateDimensions(activeItem);
			}

			/**
			 * Run the user-defined resize function
			 */
			opts.onResize?.(container, activeItem);

		});

		rulerObserver.observe(node);

		return {
			destroy() {
				rulerObserver.disconnect();
			}
		};

	};

</script>

{#if items}
	<div
		use:containerActions
		class="bp-wrap"
		class:bp-zoomed={$zoomed}
		class:bp-inline={inline}
		class:bp-small={smallScreen}
		class:bp-noclose={opts.noClose}
	>
		<div class="bp-overlay" in:fly|global={defaultTweenOptions(500)} out:fly|global={defaultTweenOptions(500)}></div>
		<div class="bp-stage">
			<div class="bp-inner">
				{#key activeItem.i}
					<div
						class="bp-slide"
						in:mediaTransition|global={true}
						out:mediaTransition|global={false}
						on:pointerdown={(e) => (clickedEl = e.target)}
						on:pointerup={function (e) {
						// only close if left click on self and not dragged
						if (e.button !== 2 && e.target === this && clickedEl === this) {
							!opts.noClose && close()
						}
					}}
					>
						{#if containerWidth > 0 && containerHeight > 0}
							{#if activeItem.img}
								<ImageItem props={getChildProps()} {smallScreen} {containerWidth} {containerHeight} {activeDimensions} />
							{:else if activeItem.sources}
								<Video props={getChildProps()} {activeDimensions} />
							{:else if activeItem.iframe}
								<Iframe props={getChildProps()} {activeDimensions} />
							{:else}
								<div class="bp-html">
									{@html activeItem.html ?? activeItem.element.outerHTML}
								</div>
							{/if}
						{/if}
					</div>
				{/key}
				<div class="bp-ruler" use:rulerActions></div>
			</div>
			{#if activeItem.caption}
				<div class="bp-caption" in:fly|global={defaultTweenOptions(500)} out:fly|global={defaultTweenOptions(500)}>
					{@html activeItem.caption}
				</div>
			{/if}
		</div>
		<div class="bp-controls" in:fly|global={defaultTweenOptions(500)} out:fly|global={defaultTweenOptions(500)}>
			<!-- close button -->
			<button class="bp-x" title="Close" aria-label="Close" on:click={close}></button>

			{#if items.length > 1}
				<!-- counter -->
				<div class="bp-count">
					{@html `${position + 1} / ${items.length}`}
				</div>
				<!-- forward / back buttons -->
				<button
					class="bp-prev"
					title="Previous"
					aria-label="Previous"
					on:click={prev}
				></button>
				<button
					class="bp-next"
					title="Next"
					aria-label="Next"
					on:click={next}
				></button>
			{/if}
		</div>
		{#if opts.thumbs && items.length > 1}
			<Thumbs {position} {setPosition} {items} />
		{/if}
	</div>
{/if}