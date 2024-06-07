<svelte:options accessors={true} immutable={true} />

<script>
	import { fly } from 'svelte/transition'
	import { cubicOut } from 'svelte/easing'
	import ImageItem from './components/image.svelte'
	import Iframe from './components/iframe.svelte'
	import Video from './components/video.svelte'
	import { writable } from 'svelte/store'
	import { closing } from './stores'

	/** items currently displayed in gallery */
	export let items = undefined

	/** element the gallery is mounted within (passed during initialization)*/
	export let target = undefined

	const html = document.documentElement

	/** index of current active item */
	let position

	/** options passed via open method */
	let opts

	/** bool tracks open state */
	let isOpen

	/** dom element to restore focus to on close */
	let focusTrigger

	/** bool true if container width < 769 */
	let smallScreen

	/** bool value of inline option passed in open method */
	let inline

	/** when position is set */
	let movement

	/** stores target on pointerdown (ref for overlay close) */
	let clickedEl

	/** active item object */
	let activeItem

	/** returns true if `activeItem` is html */
	const activeItemIsHtml = () =>
		!activeItem.img && !activeItem.sources && !activeItem.iframe

	/** function set by child component to run when container resized */
	let resizeFunc
	/** used by child components to set resize function */
	const setResizeFunc = (fn) => (resizeFunc = fn)

	/** container element (el) / width (w) / height (h) */
	const container = {}

	// /** true if image is currently zoomed past starting size */
	const zoomed = writable(0)

	$: if (items) {
		// update active item when position changes
		activeItem = items[position]
		if (isOpen) {
			// run onUpdate when items updated
			opts.onUpdate?.(container.el, activeItem)
		}
	}

	/** receives options and opens gallery */
	export const open = (options) => {
		opts = options
		inline = opts.inline
		// add class to hide scroll if not inline gallery
		if (!inline && html.scrollHeight > html.clientHeight) {
			html.classList.add('bp-lock')
		}
		// update trigger element to restore focus
		focusTrigger = document.activeElement
		container.w = target.offsetWidth
		container.h =
			target === document.body ? window.innerHeight : target.clientHeight
		smallScreen = container.w < 769
		position = opts.position || 0
		// set items
		items = []
		for (let i = 0; i < (opts.items.length || 1); i++) {
			let item = opts.items[i] || opts.items
			if ('dataset' in item) {
				items.push({ element: item, i, ...item.dataset })
			} else {
				item.i = i
				items.push(item)
				// set item to element for position check below
				item = item.element
			}
			// override gallery position if needed
			if (opts.el && opts.el === item) {
				position = i
			}
		}
	}

	/** closes gallery */
	export const close = () => {
		opts.onClose?.(container.el, activeItem)
		closing.set(true)
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
				const { focusWrap = container.el } = opts
				const tabbable = [...focusWrap.querySelectorAll('*')].filter(
					(node) => node.tabIndex >= 0
				)
				let index = tabbable.indexOf(activeElement)
				index += tabbable.length + (shiftKey ? -1 : 1)
				tabbable[index % tabbable.length].focus()
			}
		}
	}

	/**
	 * calculate dimensions of height / width resized to fit within container
	 * @param {object} item object with height / width properties
	 * @returns {Array} [width: number, height: number]
	 */
	const calculateDimensions = ({ width = 1920, height = 1080 }) => {
		const { scale = 0.99 } = opts
		const ratio = Math.min(
			1,
			(container.w / width) * scale,
			(container.h / height) * scale
		)
		// round number so we don't use a float as the sizes attribute
		return [Math.round(width * ratio), Math.round(height * ratio)]
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
		if (item.img) {
			const image = document.createElement('img')
			image.sizes = opts.sizes || `${calculateDimensions(item)[0]}px`
			image.srcset = item.img
			item.preload = true
			return image.decode().catch((error) => {})
		}
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
		let dimensions

		if (activeItemIsHtml()) {
			const bpItem = node.firstChild.firstChild
			dimensions = [bpItem.clientWidth, bpItem.clientHeight]
		} else {
			dimensions = calculateDimensions(activeItem)
		}

		// rect is bounding rect of trigger element
		const rect = (activeItem.element || focusTrigger).getBoundingClientRect()
		const leftOffset = rect.left - (container.w - rect.width) / 2
		const centerTop = rect.top - (container.h - rect.height) / 2
		const scaleWidth = rect.width / dimensions[0]
		const scaleHeight = rect.height / dimensions[1]

		return {
			duration: 480,
			easing: cubicOut,
			css: (t, u) => {
				return `transform:translate3d(${leftOffset * u}px, ${
					centerTop * u
				}px, 0) scale3d(${scaleWidth + t * (1 - scaleWidth)}, ${
					scaleHeight + t * (1 - scaleHeight)
				}, 1)`
			},
		}
	}

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
		setResizeFunc,
		zoomed,
		container,
	})

	/** code to run on mount / destroy */
	const containerActions = (node) => {
		container.el = node
		let roActive
		opts.onOpen?.(container.el, activeItem)
		// don't use keyboard events for inline galleries
		if (!inline) {
			window.addEventListener('keydown', onKeydown)
		}
		// set up resize observer
		const ro = new ResizeObserver((entries) => {
			// use roActive to avoid running on initial open
			if (roActive) {
				container.w = entries[0].contentRect.width
				container.h = entries[0].contentRect.height
				smallScreen = container.w < 769
				// run child component resize function
				if (!activeItemIsHtml()) {
					resizeFunc?.()
				}
				// run user defined onResize function
				opts.onResize?.(container.el, activeItem)
			}
			roActive = true
		})
		ro.observe(node)
		return {
			destroy() {
				ro.disconnect()
				window.removeEventListener('keydown', onKeydown)
				closing.set(false)
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
		class:bp-zoomed={$zoomed}
		class:bp-inline={inline}
		class:bp-small={smallScreen}
		class:bp-noclose={opts.noClose}
	>
		<div out:fly|local={{ duration: 480 }} />
		{#key activeItem.i}
			<div
				class="bp-inner"
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
				{#if activeItem.img}
					<ImageItem props={getChildProps()} {smallScreen} />
				{:else if activeItem.sources}
					<Video props={getChildProps()} />
				{:else if activeItem.iframe}
					<Iframe props={getChildProps()} />
				{:else}
					<div class="bp-html">
						{@html activeItem.html ?? activeItem.element.outerHTML}
					</div>
				{/if}
			</div>
			{#if activeItem.caption}
				<div class="bp-cap" out:fly|global={{ duration: 200 }}>
					{@html activeItem.caption}
				</div>
			{/if}
		{/key}

		<div class="bp-controls" out:fly|local>
			<!-- close button -->
			<button class="bp-x" title="Close" aria-label="Close" on:click={close} />

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
	</div>
{/if}
