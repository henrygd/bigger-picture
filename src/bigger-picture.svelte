<svelte:options accessors={true} immutable={true} />

<script>
	import { fly, fade } from 'svelte/transition'
	import { cubicOut } from 'svelte/easing'
	import ImageItem from './components/image.svelte'
	import Iframe from './components/iframe.svelte'
	import Video from './components/video.svelte'
	import { zoomed, closing } from './stores'
	import { listen, element as createEl } from 'svelte/internal'

	export let items = undefined
	export let target = undefined

	const { documentElement: html } = document

	// index of current active item
	let position

	// options passed via open method
	let opts

	// bool tracks open state
	let isOpen

	// dom element to restore focus to on close
	let focusTrigger

	// container element
	let container, containerWidth, containerHeight

	// bool controlling visual state of controls
	let hideControls

	// bool true if containerWidth < 769
	let smallScreen

	// bool value of inline option passed in open method
	let inline

	// when position is set
	let movement

	// stores target on pointerdown (ref for overlay close)
	let clickedEl

	// active item object
	let activeItem

	// true if activeItem is html
	let activeItemIsHtml

	// function set by child component to run when container resized
	let resizeFunc
	const setResizeFunc = (fn) => (resizeFunc = fn)

	$: if (items) {
		// update active item when position changes
		activeItem = items[position]
		if (isOpen) {
			activeItemIsHtml = activeItem.hasOwnProperty('html')
			// clear child resize function if html
			activeItemIsHtml && setResizeFunc(null)
			// run onUpdate when items updated
			opts.onUpdate && opts.onUpdate(container, activeItem)
		}
	}

	// receives options and opens gallery
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
		items = Array.isArray(openItems)
			? // array was passed
			  openItems.map((item, i) => ({ ...item, i }))
			: // nodelist / node was passed
			  [...(openItems.length ? openItems : [openItems])].map((element, i) => {
					// set gallery position
					if (element === opts.el) {
						position = i
					}
					return { element, i, ...element.dataset }
			  })
	}

	export const close = () => {
		if (!opts.noClose) {
			opts.onClose && opts.onClose()
			$closing = 1
			items = false
			// restore focus to trigger element
			focusTrigger && focusTrigger.focus({ preventScroll: true })
		}
	}

	// previous gallery item
	export const prev = () => setPosition(position - 1)

	// next gallery item
	export const next = () => setPosition(position + 1)

	// go to specific item in gallery
	export const setPosition = (index) => {
		movement = index - position
		position = getNextPosition(index)
	}

	// get next gallery position
	const getNextPosition = (index) => {
		if (index >= items.length) {
			index = 0
		} else if (index < 0) {
			index = items.length - 1
		}
		return index
	}

	const onKeydown = (e) => {
		const { key, shiftKey } = e
		if (key === 'Escape') {
			close()
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
				index %= tabbable.length
				tabbable[index].focus()
			}
		}
	}

	// calculates dimensions within window for given height / width
	const calculateDimensions = (fullWidth, fullHeight) => {
		fullWidth = fullWidth || 1920
		fullHeight = fullHeight || 1080

		const scale = opts.scale || 0.99

		let width, height

		const windowAspect = containerHeight / containerWidth
		const mediaAspect = fullHeight / fullWidth

		if (mediaAspect > windowAspect) {
			height = Math.min(fullHeight, containerHeight * scale)
			width = height / mediaAspect
		} else {
			width = Math.min(fullWidth, containerWidth * scale)
			height = width * mediaAspect
		}
		return [Math.round(width), Math.round(height)]
	}

	// preloads images for previous and next items in gallery
	const preloadNext = () => {
		const nextItem = items[getNextPosition(position + 1)]
		const prevItem = items[getNextPosition(position - 1)]
		nextItem && !nextItem.preload && loadImage(nextItem)
		prevItem && !prevItem.preload && loadImage(prevItem)
	}

	// loads / decodes image for item
	const loadImage = (item) => {
		const { img, width, height } = item
		if (!img) {
			return
		}
		const image = createEl('img')
		image.sizes = opts.sizes || `${calculateDimensions(width, height)[0]}px`
		image.srcset = img
		item.preload = image
		return image.decode()
	}

	// animate media in when bp is first opened
	const animateIn = (node) => {
		if (!isOpen) {
			isOpen = 1
			opts.onOpen && opts.onOpen(container, activeItem)
			return opts.intro ? fly(node, { y: 10, easing: cubicOut }) : scaleIn(node)
		}
		return fly(node, {
			x: movement > 0 ? 20 : -20,
			easing: cubicOut,
			duration: 250,
		})
	}

	// animate media out when bp is closed
	const animateOut = (node) => {
		if (!items) {
			return opts.intro
				? fly(node, { y: -10, easing: cubicOut })
				: scaleIn(node)
		}
		return fly(node, {
			x: movement > 0 ? -20 : 20,
			easing: cubicOut,
			duration: 250,
		})
	}

	// custom svelte transition for entrance zoom
	const scaleIn = (node) => {
		const { element } = activeItem

		const bpItem = node.querySelector('.bp-item')

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
				}px, 0px) scale3d(${scaleWidth + t * (1 - scaleWidth)}, ${
					scaleHeight + t * (1 - scaleHeight)
				}, 1)`
			},
		}
	}

	// toggle controls for small screen
	const toggleControls = () => (hideControls = !hideControls)

	const containerActions = (node) => {
		container = node
		let removeKeydownListener
		let roActive
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
				resizeFunc && resizeFunc()
				// run user defined onResize function
				opts.onResize && opts.onResize(container, activeItem)
			}
			roActive = true
		})
		ro.observe(node)
		return {
			destroy() {
				ro.disconnect()
				removeKeydownListener && removeKeydownListener()
				$closing = isOpen = false
				// remove class hiding scroll
				html.classList.remove('bp-lock')
				opts.onClosed && opts.onClosed()
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
	>
		<div transition:fade={{ easing: cubicOut, duration: 480 }} />
		{#key activeItem.i}
			<div
				class="bp-inner"
				class:bp-html={activeItemIsHtml}
				in:animateIn
				out:animateOut
				on:pointerdown={(e) => (clickedEl = e.target)}
				on:pointerup={function (e) {
					// only close if left click on self and not dragged
					if (e.button !== 2 && e.target === this && clickedEl === this) {
						close()
					}
				}}
			>
				{#if activeItem.img}
					<ImageItem
						stuff={{
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
						}}
						{containerWidth}
						{containerHeight}
						{smallScreen}
					/>
				{:else if activeItem.sources}
					<Video
						stuff={{
							activeItem,
							calculateDimensions,
							setResizeFunc,
						}}
					/>
				{:else if activeItem.iframe}
					<Iframe
						stuff={{
							activeItem,
							calculateDimensions,
							setResizeFunc,
						}}
					/>
				{:else}
					{@html activeItem.html}
				{/if}
			</div>
			{#if activeItem.caption}
				<div class="bp-cap" transition:fade={{ duration: 200 }}>
					{@html activeItem.caption}
				</div>
			{/if}
		{/key}

		{#if !smallScreen || !hideControls}
			<div class="bp-controls" transition:fade={{ duration: 300 }}>
				<!-- close button -->
				{#if !opts.noClose}
					<button
						class="bp-x"
						title="Close"
						aria-label="Close"
						on:click={close}
					/>
				{/if}

				{#if items.length > 1}
					<!-- counter -->
					<div class="bp-count">
						{`${position + 1} / ${items.length}`}
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
