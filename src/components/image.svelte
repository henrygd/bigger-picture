<script>
	import { tweened } from 'svelte/motion'
	import { cubicOut } from 'svelte/easing'
	import { zoomed, closing, prefersReducedMotion } from '../stores'
	import { fade } from 'svelte/transition'
	import Loading from './loading.svelte'

	export let stuff
	export let containerWidth
	export let containerHeight
	export let smallScreen

	let {
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
	} = stuff

	let { inline } = opts
	let { img: srcset, thumb, alt, width, height } = activeItem

	let maxZoom = activeItem.maxZoom || opts.maxZoom || 10

	let naturalWidth = +width
	let naturalHeight = +height
	let calculatedDimensions = calculateDimensions(naturalWidth, naturalHeight)
	let sizes = calculatedDimensions[0]

	// tracks load state of image
	let loaded, showLoader

	// cache events to handle pinch
	let eventCache = []

	// store positions for drag inertia
	let dragPositions = []

	// bool true if multiple touch events
	let isPinch

	// track distance for pinch events
	let prevDiff = 0

	let pointerDown, hasDragged
	let dragStartX, dragStartY

	// zoomDragTranslate values on start of drag
	let dragStartTranslateX, dragStartTranslateY

	// double click timeout (mobile controls)
	let doubleClickTimeout

	// if true, adds class to .bp-wrap to avoid image cropping
	let closingWhileZoomed

	// options for tweens - no animation if prefers reduced motion
	const tweenOptions = {
		easing: cubicOut,
		duration: prefersReducedMotion ? 0 : 400,
	}

	// tween to control image size
	const imageDimensions = tweened(calculatedDimensions, tweenOptions)
	// translate transform for pointerDown
	const zoomDragTranslate = tweened([0, 0], tweenOptions)

	$: $zoomed = $imageDimensions[0] > calculatedDimensions[0]

	// if zoomed while closing, zoom out image and add class
	// to change contain value on .bp-wrap to avoid cropping
	$: if ($closing && $zoomed && !opts.intro) {
		closingWhileZoomed = true
		zoomDragTranslate.set([0, 0])
	}

	// calculate translate position with bounds
	const boundTranslateValues = ([x, y], newDimensions = $imageDimensions) => {
		// image drag translate bounds
		const maxTranslateX = (newDimensions[0] - containerWidth) / 2
		const maxTranslateY = (newDimensions[1] - containerHeight) / 2
		// x max drag
		if (maxTranslateX < 0) {
			x = 0
		} else if (x > maxTranslateX) {
			if (smallScreen) {
				// bound to left side (allow slight over drag)
				x = pointerDown
					? maxTranslateX + (x - maxTranslateX) / 10
					: maxTranslateX
				// previous item if dragged past threshold
				x > maxTranslateX + 20 && prev()
			} else {
				x = maxTranslateX
			}
		} else if (x < maxTranslateX * -1) {
			// bound to right side (allow slight over drag)
			if (smallScreen) {
				x = pointerDown
					? maxTranslateX * -1 - (maxTranslateX * -1 - x) / 10
					: maxTranslateX * -1
				// next item if dragged past threshold
				x < maxTranslateX * -1 - 20 && next()
			} else {
				x = maxTranslateX * -1
			}
		}
		// y max drag
		if (maxTranslateY < 0) {
			y = 0
		} else if (y > maxTranslateY) {
			y = maxTranslateY
		} else if (y < maxTranslateY * -1) {
			y = maxTranslateY * -1
		}
		return [x, y]
	}

	// updates zoom level in or out based on amt value
	const changeZoom = (e, amt = maxZoom) => {
		if ($closing) {
			return
		}

		const cd = calculateDimensions(naturalWidth, naturalHeight)
		const maxWidth = cd[0] * maxZoom

		const [currentImageWidth, currentImageHeight] = $imageDimensions

		let newWidth = currentImageWidth + currentImageWidth * amt
		let newHeight = currentImageHeight + currentImageHeight * amt

		if (amt > 0) {
			if (newWidth > maxWidth) {
				// requesting size large than max zoom
				newWidth = maxWidth
				newHeight = cd[1] * maxZoom
			}
			if (newWidth > naturalWidth) {
				// if requesting zoom larger than natural size
				newWidth = naturalWidth
				newHeight = naturalHeight
			}
		} else if (newWidth < cd[0]) {
			// if requesting image smaller than starting size
			imageDimensions.set(cd)
			zoomDragTranslate.set([0, 0])
			return
		}

		let { x, y, width, height } = e.target.getBoundingClientRect()

		// distance clicked from center of image
		const offsetX = e.clientX - x - width / 2
		const offsetY = e.clientY - y - height / 2

		x = offsetX * -1 * (newWidth / width) + offsetX
		y = offsetY * -1 * (newHeight / height) + offsetY

		const newDimensions = [newWidth, newHeight]

		// set new dimensions and update sizes property
		imageDimensions.set(newDimensions).then(() => {
			sizes = Math.round(Math.max(sizes, newWidth))
		})

		// update translate value
		zoomDragTranslate.set(
			boundTranslateValues(
				[$zoomDragTranslate[0] + x, $zoomDragTranslate[1] + y],
				newDimensions
			)
		)
	}

	const onWheel = (e) => {
		// return if scrolling past inline gallery w/ wheel
		if (inline && !$zoomed) {
			return
		}
		// preventDefault to stop scrolling on zoomed inline image
		e.preventDefault()
		// change zoom on wheel
		const deltaY = e.deltaY / -300
		changeZoom(e, deltaY)
	}

	// on drag start, store initial position and image translate values
	const onPointerDown = (e) => {
		// don't run if right click
		if (e.button !== 2) {
			e.preventDefault()
			pointerDown = true
			eventCache.push(e)
			const [x, y] = [e.clientX, e.clientY]
			dragStartX = x
			dragStartY = y
			dragStartTranslateX = $zoomDragTranslate[0]
			dragStartTranslateY = $zoomDragTranslate[1]
		}
	}

	// on drag, update image translate val
	const onPointerMove = (e) => {
		if (eventCache.length > 1) {
			isPinch = true
			pointerDown = false
			return handlePinch(e)
		}

		if (!pointerDown) {
			return
		}

		let [x, y] = [e.clientX, e.clientY]

		// store positions for inertia
		dragPositions.push({ x, y })

		// overall drag diff from start location
		x = x - dragStartX
		y = y - dragStartY

		// handle unzoomed left / right / up swipes
		if (!$zoomed) {
			// previous if swipe left
			if (x > 40) {
				// pointerdown = undefined to stop pointermove from running again
				pointerDown = prev()
			}
			// next if swipe right
			if (x < -40) {
				// pointerdown = undefined to stop pointermove from running again
				pointerDown = next()
			}
			// close if swipe up (don't close if inline)
			if (y < -90 && !inline) {
				close()
			}
		}

		hasDragged = Math.hypot(x, y) > 10

		// image drag when zoomed
		if ($zoomed && hasDragged && !$closing) {
			zoomDragTranslate.set(
				boundTranslateValues([
					dragStartTranslateX + x,
					dragStartTranslateY + y,
				]),
				{ duration: 0 }
			)
		}
	}

	const handlePinch = (e) => {
		// update event in cache
		eventCache = eventCache.map((ev) => (ev.pointerId == e.pointerId ? e : ev))

		// Calculate the distance between the two pointers
		const [p1, p2] = eventCache
		const dx = p1.clientX - p2.clientX
		const dy = p1.clientY - p2.clientY
		const curDiff = Math.hypot(dx, dy)

		if (!prevDiff) {
			prevDiff = curDiff
		}

		// scale image
		changeZoom(e, (prevDiff - curDiff) * -0.02)

		// Cache the distance for the next move event
		prevDiff = curDiff
	}

	// on mouse / touch end, set pointerDown to false
	function onPointerUp(e) {
		// remove event from event cache
		eventCache = eventCache.filter((ev) => ev.pointerId != e.pointerId)

		if (isPinch) {
			// set isPinch to false after second finger lifts
			isPinch = eventCache.length ? true : false
			prevDiff = 0
			return
		}

		// make sure pointer events don't carry over to next image
		if (!pointerDown) {
			return
		}

		// close if overlay is clicked
		if (e.target === this && !inline) {
			return close()
		}

		pointerDown = false

		if (!smallScreen) {
			// if largescreen
			// single tap zooms in / out
			if ($zoomed) {
				hasDragged || changeZoom(e, -5)
			} else {
				// zoom in if not zoomed and drag scrolling page
				dragPositions.length < 2 && !$zoomed && changeZoom(e)
			}
		} else {
			// if smallscreen
			// toggle controls on click / zoom on double click
			if (!hasDragged) {
				if (doubleClickTimeout) {
					clearTimeout(doubleClickTimeout)
					changeZoom(e, $zoomed ? -5 : 5)
					doubleClickTimeout = 0
				} else {
					doubleClickTimeout = setTimeout(() => {
						toggleControls()
						doubleClickTimeout = 0
					}, 250)
				}
			}
		}

		// add drag inertia / snap back to bounds
		if (hasDragged) {
			dragPositions = dragPositions.slice(-3)
			let coords
			let xDiff = dragPositions[1].x - dragPositions[2].x
			let yDiff = dragPositions[1].y - dragPositions[2].y
			if (Math.hypot(xDiff, yDiff) > 5) {
				xDiff = dragPositions[0].x - dragPositions[2].x
				yDiff = dragPositions[0].y - dragPositions[2].y
				coords = [
					$zoomDragTranslate[0] - xDiff * 5,
					$zoomDragTranslate[1] - yDiff * 5,
				]
			} else {
				coords = $zoomDragTranslate
			}

			zoomDragTranslate.set(boundTranslateValues(coords))
		}

		// reset pointer states
		hasDragged = false
		// reset dragPositions
		dragPositions = []
	}

	const onMount = () => {
		// handle window resize
		setResizeFunc(() => {
			calculatedDimensions = calculateDimensions(naturalWidth, naturalHeight)
			// adjust image size / zoom on resize
			imageDimensions.set(calculatedDimensions)
			zoomDragTranslate.set([0, 0])
		})
		// decode initial image before rendering
		loadImage(activeItem).then(() => {
			loaded = true
			preloadNext()
		})
		// show loading indicator if needed
		setTimeout(() => {
			showLoader = !loaded
		}, 250)
	}
</script>

<div
	class="bp-img-wrap"
	use:onMount
	on:wheel={onWheel}
	on:pointerdown={onPointerDown}
	on:pointermove={onPointerMove}
	on:pointerup={onPointerUp}
	on:pointercancel={onPointerUp}
	class:bp-drag={pointerDown}
	class:bp-close={closingWhileZoomed}
>
	<div
		class="bp-item bp-img"
		style="
			background-image:url({thumb});
			width:{$imageDimensions[0]}px;
			height:{$imageDimensions[1]}px;
			transform:translate3d({$zoomDragTranslate[0]}px, {$zoomDragTranslate[1]}px, 0px)
		"
	>
		{#if loaded}
			<img {srcset} sizes={opts.sizes || `${sizes}px`} {alt} out:fade />
		{/if}
		{#if showLoader}
			<Loading {thumb} {loaded} />
		{/if}
	</div>
</div>
