<svelte:options accessors={true} immutable={true} />

<script>
	import { fly } from 'svelte/transition'
	import { cubicOut } from 'svelte/easing'
	import ImageItem from './components/image.svelte'
	import Iframe from './components/iframe.svelte'
	import Video from './components/video.svelte'
	import { zoomed, closing } from './stores'
	import { listen, element as createEl } from 'svelte/internal'

	/** items currently displayed in gallery */
	export let items = undefined

	/** element the gallery is mounted within (passed during initialization)*/
	export let target = undefined

	const { documentElement: html } = document

	/** index of current active item */
	let position

	/** options passed via open method */
	let opts

	/** bool tracks open state */
	let isOpen

	/** dom element to restore focus to on close */
	let focusTrigger

	/** container element */
	let container, containerWidth, containerHeight

	/** bool controlling visual state of controls */
	let hideControls

	/** bool true if containerWidth < 769 */
	let smallScreen

	/** bool value of inline option passed in open method */
	let inline

	/** when position is set */
	let movement

	/** stores target on pointerdown (ref for overlay close) */
	let clickedEl

	/** active item object */
	let activeItem

	/** true if activeItem is html */
	let activeItemIsHtml

	/** function set by child component to run when container resized */
	let resizeFunc
	/** used by child components to set resize function */
	const setResizeFunc = (fn) => (resizeFunc = fn)

	$: if (items) {
		// update active item when position changes
		activeItem = items[position]
		activeItemIsHtml = activeItem.hasOwnProperty('html')
		if (isOpen) {
			// clear child resize function if html
			activeItemIsHtml && setResizeFunc(null)
			// run onUpdate when items updated
			opts.onUpdate?.(container, activeItem)
		}
	}

	/** receives options and opens gallery */
	export const open = (options) => {
		opts = options
		inline = opts.inline
		const openItems = opts.items
		// update trigger element to restore focus
		// add class to hide scroll if not inline gallery
		if (!inline && html.scrollHeight > html.clientHeight) {
			html.classList.add('bp-lock')
		}
		focusTrigger = document.activeElement
		containerWidth = target.offsetWidth
		containerHeight =
			target === document.body ? window.innerHeight : target.clientHeight
		smallScreen = containerWidth < 769
		position = opts.position || 0
		// reset controls
		hideControls = false
		// make array w/ dataset to work with
		if (Array.isArray(openItems)) {
			// array was passed
			items = openItems.map((item, i) => {
				// override gallery position if needed
				if (opts.el && opts.el === item.element) {
					position = i
				}
				return { i, ...item }
			})
		} else {
			// nodelist / node was passed
			items = (openItems.length ? [...openItems] : [openItems]).map(
				(element, i) => {
					// override gallery position if needed
					if (opts.el === element) {
						position = i
					}
					return { element, i, ...element.dataset }
				}
			)
		}
	}

	/** closes gallery */
	export const close = () => {
		opts.onClose?.()
		$closing = true
		items = null
		// restore focus to trigger element
		focusTrigger?.focus({ preventScroll: true })
	}

	/** previous gallery item */
	export const prev = () => setPosition(position - 1)

	/** next gallery item */
	export const next = () => setPosition(position + 1)

	/**
	 * go to specific item in gallery
	 * @param {number} index
	 */
	export const setPosition = (index) => {
		movement = index - position
		position = getNextPosition(index)
	}

	/**
	 * returns next gallery position (looped if neccessary)
	 * @param {number} index
	 */
	const getNextPosition = (index) => (index + items.length) % items.length

	const onKeydown = (e) => {
		const { key, shiftKey } = e
		if (key === 'Escape') {
			!opts.noClose && close()
		} else if (key === 'ArrowRight') {
			next()
		} else if (key === 'ArrowLeft') {
			prev()
		} else if (key === 'Tab') {
			// trap focus on tab press
			const { activeElement } = document
			// allow browser to handle tab into video controls only
			if (shiftKey || !activeElement.controls) {
				e.preventDefault()
				const focusWrap = opts.focusWrap || container
				const tabbable = [...focusWrap.querySelectorAll('*')].filter(
					(n) => n.tabIndex >= 0
				)
				let index = tabbable.indexOf(activeElement)
				index += tabbable.length + (shiftKey ? -1 : 1)
				tabbable[index % tabbable.length].focus()
			}
		}
	}

	/**
	 * calculates dimensions within window bounds for given height / width
	 * @param {number} width full width of media
	 * @param {number} height full height of media
	 * @returns {Array} [width: number, height: number]
	 */
	const calculateDimensions = (width, height) => {
		width = width || 1920
		height = height || 1080

		const scale = opts.scale || 0.99
		const windowAspect = containerHeight / containerWidth
		const mediaAspect = height / width

		if (mediaAspect > windowAspect) {
			height = Math.min(height, containerHeight * scale)
			width = height / mediaAspect
		} else {
			width = Math.min(width, containerWidth * scale)
			height = width * mediaAspect
		}
		return [Math.round(width), Math.round(height)]
	}

	/** preloads images for previous and next items in gallery */
	const preloadNext = () => {
		if (items) {
			const nextItem = items[getNextPosition(position + 1)]
			const prevItem = items[getNextPosition(position - 1)]
			!nextItem.preload && loadImage(nextItem)
			!prevItem.preload && loadImage(prevItem)
		}
	}

	/** loads / decodes image for item */
	const loadImage = (item) => {
		const { img, width, height } = item
		if (!img) {
			return
		}
		const image = createEl('img')
		image.sizes = opts.sizes || `${calculateDimensions(width, height)[0]}px`
		image.srcset = img
		item.preload = true
		return image.decode()
	}

	/** svelte transition to control opening / changing */
	const mediaTransition = (node, isEntering) => {
		if (!isOpen || !items) {
			// entrance / exit transition
			isOpen = isEntering
			return opts.intro
				? fly(node, { y: isEntering ? 10 : -10 })
				: scaleIn(node)
		}
		// forward / backward transition
		return fly(node, {
			x: (movement > 0 ? 20 : -20) * (isEntering ? 1 : -1),
			duration: 250,
		})
	}

	/** custom svelte transition for entrance zoom */
	const scaleIn = (node) => {
		let bpItem = node.firstElementChild

		// images and html have a wrapper div, so we must go deeper
		if (activeItem.img || activeItemIsHtml) {
			bpItem = bpItem.firstElementChild
		}

		const element = activeItem.element || focusTrigger

		const { clientWidth, clientHeight } = bpItem

		const { top, left, width, height } = element.getBoundingClientRect()
		const leftOffset = left - (containerWidth - width) / 2
		const centerTop = top - (containerHeight - height) / 2
		const scaleWidth = element.clientWidth / clientWidth
		const scaleHeight = element.clientHeight / clientHeight

		return {
			duration: 480,
			easing: cubicOut,
			css: (t) => {
				const tDiff = 1 - t
				return `transform:translate3d(${leftOffset * tDiff}px, ${
					centerTop * tDiff
				}px, 0) scale3d(${scaleWidth + t * (1 - scaleWidth)}, ${
					scaleHeight + t * (1 - scaleHeight)
				}, 1)`
			},
		}
	}

	/** toggle controls shown / hidden */
	const toggleControls = () => (hideControls = !hideControls)

	/** provides object w/ needed funcs / data to child components  */
	const getChildProps = () => ({
		activeItem,
		calculateDimensions,
		loadImage,
		preloadNext,
		opts,
		prev,
		next,
		close,
		toggleControls,
		setResizeFunc,
	})

	/** code to run on mount / destroy */
	const containerActions = (node) => {
		container = node
		let removeKeydownListener
		let roActive
		opts.onOpen?.(container, activeItem)
		// don't use keyboard events for inline galleries
		if (!inline) {
			removeKeydownListener = listen(window, 'keydown', onKeydown)
		}
		// set up resize observer
		const ro = new ResizeObserver((entries) => {
			// use roActive to avoid running on initial open
			if (roActive) {
				containerWidth = entries[0].contentRect.width
				containerHeight = entries[0].contentRect.height
				smallScreen = containerWidth < 769
				// run child component resize function
				resizeFunc?.()
				// run user defined onResize function
				opts.onResize?.(container, activeItem)
			}
			roActive = true
		})
		ro.observe(node)
		return {
			destroy() {
				ro.disconnect()
				removeKeydownListener?.()
				$closing = false
				// remove class hiding scroll
				html.classList.remove('bp-lock')
				opts.onClosed?.()
			},
		}
	}
</script>

{#if items}
	<div
		use:containerActions
		class="bp-wrap"
		class:zoomed={$zoomed}
		class:bp-inline={inline}
		class:bp-noclose={opts.noClose}
	>
		<div out:fly={{ duration: 480 }} />
		{#key activeItem.i}
			<div
				class="bp-inner"
				in:mediaTransition={true}
				out:mediaTransition={false}
				on:pointerdown={(e) => (clickedEl = e.target)}
				on:pointerup={function (e) {
					// only close if left click on self and not dragged
					if (e.button !== 2 && e.target === this && clickedEl === this) {
						!opts.noClose && close()
					}
				}}
			>
				{#if activeItem.img}
					<ImageItem
						stuff={getChildProps()}
						{containerWidth}
						{containerHeight}
						{smallScreen}
					/>
				{:else if activeItem.sources}
					<Video stuff={getChildProps()} />
				{:else if activeItem.iframe}
					<Iframe stuff={getChildProps()} />
				{:else}
					<div class="bp-html">
						{@html activeItem.html}
					</div>
				{/if}
			</div>
			{#if activeItem.caption}
				<div class="bp-cap" tabindex="0" out:fly={{ duration: 200 }}>
					{@html activeItem.caption}
				</div>
			{/if}
		{/key}

		{#if !smallScreen || !hideControls}
			<div class="bp-controls" out:fly={{ duration: 300 }}>
				<!-- close button -->
				<button
					class="bp-x"
					title="Close"
					aria-label="Close"
					on:click={close}
				/>

				{#if items.length > 1}
					<!-- counter -->
					<div class="bp-count">
						{@html `${position + 1} / ${items.length}`}
					</div>
					<!-- foward / back buttons -->
					<button
						class="bp-prev"
						title="Previous"
						aria-label="Previous"
						on:click={prev}
					/>
					<button
						class="bp-next"
						title="Next"
						aria-label="Next"
						on:click={next}
					/>
				{/if}
			</div>
		{/if}
	</div>
{/if}
