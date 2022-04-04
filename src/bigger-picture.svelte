<svelte:options accessors={true} immutable={true} />

<script>
	import { fly, fade } from 'svelte/transition'
	import { cubicOut } from 'svelte/easing'
	import ImageItem from './components/image.svelte'
	import Iframe from './components/iframe.svelte'
	import Video from './components/video.svelte'
	import { zoomed, closing } from './stores'
	import { hideScroll, showScroll } from 'hide-show-scroll'

	export let items
	export let position
	export let target

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

	$: if (items) {
		activeItem = items[position]
		container && opts.onUpdate && opts.onUpdate(container, activeItem)
	}

	export const open = (options) => {
		let openItems = options.items
		focusTrigger = document.activeElement
		// containerWidth = target.clientWidth
		opts = options
		inline = opts.inline
		// disable scroll if not inline gallery
		inline || hideScroll()
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
			  openItems.map((item, i) => ({ ...item, ...{ i } }))
			: // nodelist / node was passed
			  [...(openItems.length ? openItems : [openItems])].map((element, i) => {
					// add unique id (i)
					let obj = { element, i }
					// set gallery position
					if (element === opts.el) {
						position = i
					}
					return { ...obj, ...element.dataset }
			  })
	}

	export const close = () => {
		if (!opts.noClose) {
			opts.onClose && opts.onClose()
			$closing = 1
			items = 0
			// restore focus to trigger element
			focusTrigger && focusTrigger.focus({ preventScroll: true })
		}
	}

	// previous gallery item
	export const prev = () => setPosition(position - 1)

	// next gallery item
	export const next = () => setPosition(position + 1)

	// go to next item in gallery
	export const setPosition = (index) => {
		movement = index - position
		position = getNextPosition(index)
	}

	// get next gallery position
	const getNextPosition = (index) => {
		if (index === items.length) {
			index = 0
		} else if (index < 0) {
			index = items.length - 1
		}
		return index
	}

	const onKeydown = (e) => {
		if (!isOpen || inline) {
			return
		}
		let { key } = e
		if (key === 'Escape') {
			close()
		} else if (key === 'ArrowRight') {
			next()
		} else if (key === 'ArrowLeft') {
			prev()
		} else if (key === 'Tab') {
			// trap focus on tab press
			e.preventDefault()
			let focusWrap = opts.focusWrap || container
			let tabbable = [...focusWrap.querySelectorAll('*')].filter(
				(n) => n.tabIndex >= 0
			)
			let index = tabbable.indexOf(document.activeElement)
			index += tabbable.length + (e.shiftKey ? -1 : 1)
			index %= tabbable.length
			tabbable[index].focus()
		}
	}

	// calculate dimensions for all but html
	const calculateDimensions = (fullWidth, fullHeight, scale) => {
		scale = opts.scale || 0.99
		let width, height

		fullWidth = fullWidth || 1920
		fullHeight = fullHeight || 1080

		const windowAspect = containerHeight / containerWidth

		const iframeAspect = fullHeight / fullWidth

		if (iframeAspect > windowAspect) {
			height = Math.min(fullHeight, containerHeight * scale)
			width = height / iframeAspect
		} else {
			width = Math.min(fullWidth, containerWidth * scale)
			height = width * iframeAspect
		}
		return [width, height]
	}

	// preloads images for previous and next items in gallery
	const preloadNext = () => {
		let nextItem = items[getNextPosition(position + 1)]
		let prevItem = items[getNextPosition(position - 1)]
		nextItem.img && !nextItem.preload && loadImage(nextItem)
		prevItem.img && !prevItem.preload && loadImage(prevItem)
	}

	// loads image for item
	const loadImage = (item) => {
		const img = new Image()
		img.src = item.img
		item.preload = img
		return img.decode()
	}

	// animate media in when bp is first opened
	const animateIn = (node) => {
		if (!isOpen) {
			isOpen = 1
			opts.onOpen && opts.onOpen(container)
			return opts.intro ? fly(node, { y: 10, easing: cubicOut }) : scaleIn(node)
		} else {
			return fly(node, {
				x: movement > 0 ? 20 : -20,
				easing: cubicOut,
				duration: 300,
			})
		}
	}

	// animate media out when bp is closed
	const animateOut = (node) => {
		if (!items) {
			return opts.intro
				? fly(node, { y: -10, easing: cubicOut })
				: scaleIn(node)
		} else {
			return fly(node, {
				x: movement > 0 ? -20 : 20,
				easing: cubicOut,
				duration: 300,
			})
		}
	}

	// custom svelte transition for entrance zoom
	const scaleIn = (node) => {
		let { element } = activeItem

		let bpItem = node.querySelector('.bp-item')

		let { clientWidth, clientHeight } = bpItem

		let { top, left, width, height } = element.getBoundingClientRect()
		let leftOffset = left - (containerWidth - width) / 2
		let centerTop = top - (containerHeight - height) / 2
		let scaleWidth = element.clientWidth / clientWidth
		let scaleHeight = element.clientHeight / clientHeight

		return {
			duration: 470,
			delay: 10,
			easing: cubicOut,
			css: (t) => {
				let tDiff = 1 - t
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

	const onResize = () => {
		smallScreen = containerWidth < 769
		opts.onResize && opts.onResize(activeItem)
	}

	const lifecycleMethods = () => {
		window.addEventListener('resize', onResize)
		return {
			destroy() {
				window.removeEventListener('resize', onResize)
				$closing = isOpen = 0
				showScroll()
				opts.onClosed && opts.onClosed()
			},
		}
	}
</script>

<svelte:window on:keydown={onKeydown} />

{#if items}
	<div
		use:lifecycleMethods
		bind:this={container}
		bind:clientHeight={containerHeight}
		bind:clientWidth={containerWidth}
		class="bp-wrap"
		class:zoomed={$zoomed}
		class:bp-inline={inline}
	>
		<div transition:fade={{ easing: cubicOut, duration: 480 }} />
		{#key activeItem.i}
			<div
				class="bp-inner"
				in:animateIn
				out:animateOut
				on:pointerdown={({ target }) => (clickedEl = target)}
				on:pointerup|self={({ target }) => {
					target === clickedEl && close()
				}}
			>
				{#if activeItem.img}
					<ImageItem
						stuff={{
							activeItem,
							calculateDimensions,
							toggleControls,
							loadImage,
							preloadNext,
							next,
							prev,
							close,
							opts,
						}}
						{containerWidth}
						{containerHeight}
						{smallScreen}
					/>
				{:else if activeItem.video}
					<Video {activeItem} {calculateDimensions} />
				{:else if activeItem.iframe}
					<Iframe {activeItem} {calculateDimensions} />
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
			<div transition:fade={{ duration: 300 }}>
				<!-- close button -->
				{#if !opts.noClose}
					<button class="bp-x" title="Close" on:click={close} />
				{/if}

				{#if items.length > 1}
					<!-- counter -->
					<div class="bp-count">
						{position + 1} / {items.length}
					</div>
					<!-- foward / back buttons -->
					<button class="bp-next" title="Next" on:click={next} />
					<button class="bp-prev" title="Previous" on:click={prev} />
				{/if}
			</div>
		{/if}
	</div>
{/if}
