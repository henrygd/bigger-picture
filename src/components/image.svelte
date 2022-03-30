<script>
	import { tweened } from 'svelte/motion'
	import { cubicOut } from 'svelte/easing'
	import { zoomed, closing } from '../stores'
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
	} = stuff

	let { img, thumb, alt, width, height } = activeItem
	let { inline } = opts

	let naturalWidth = +width
	let naturalHeight = +height
	let calculatedDimensions = calculateDimensions(naturalWidth, naturalHeight)

	let loaded
	let eventCache = []
	// store positions for drag inertia
	let dragPositions = []
	let prevDiff = 0
	let isPinch
	let cancelEvents
	let pointerDown, hasDragged
	let dragStartX, dragStartY
	// zoomDragTranslate values on start of drag
	let dragStartTranslateX, dragStartTranslateY
	// double click timeout (mobile)
	let doubleClickTimeout

	// $: loaded = ~$loadedImages.indexOf(activeItem.img)

	// tween to control image size
	const imageDimensions = tweened(calculatedDimensions, {
		easing: cubicOut,
	})
	// translate transform for pointerDown
	const zoomDragTranslate = tweened([0, 0], {
		easing: cubicOut,
	})

	$: $zoomed = $imageDimensions[0] > calculatedDimensions[0]

	// reset translate if closing while zoomed
	$: if ($closing && !opts.intro) {
		$zoomDragTranslate = [0, 0]
	}

	// calculate translate position with bounds
	const boundTranslateValues = ([x, y]) => {
		// image drag translate bounds
		let maxTranslateX = ($imageDimensions[0] - containerWidth) / 2
		let maxTranslateY = ($imageDimensions[1] - containerHeight) / 2
		// x max drag
		if (maxTranslateX < 0) {
			x = 0
		} else if (x > maxTranslateX) {
			if (smallScreen) {
				// bound to left side (allow slight over drag)
				x = pointerDown
					? maxTranslateX + (x - maxTranslateX) / 10
					: maxTranslateX
				if (x > maxTranslateX + 20) {
					// previous item if dragged past threshold
					cancelEvents = true
					prev()
				}
			} else {
				x = maxTranslateX
			}
		} else if (x < maxTranslateX * -1) {
			// bound to right side (allow slight over drag)
			if (smallScreen) {
				x = pointerDown
					? maxTranslateX * -1 - (maxTranslateX * -1 - x) / 10
					: maxTranslateX * -1
				if (x < maxTranslateX * -1 - 20) {
					// next item if dragged past threshold
					cancelEvents = true
					next()
				}
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

	const changeZoom = (e, amt = 5) => {
		// opts.onZoom && opts.onZoom(amt)

		let newWidth = $imageDimensions[0] + $imageDimensions[0] * amt
		let newHeight = $imageDimensions[1] + $imageDimensions[1] * amt

		if (amt > 0 && newWidth > naturalWidth) {
			newWidth = naturalWidth
			newHeight = naturalHeight

			// $imageDimensions = [naturalWidth, naturalHeight]
			// return
		} else if (amt < 0) {
			let cd = calculateDimensions(naturalWidth, naturalHeight)
			if (newWidth < cd[0]) {
				$imageDimensions = cd
				$zoomDragTranslate = [0, 0]
				return
			}
		}

		$imageDimensions = [newWidth, newHeight]

		if (amt < 1) {
			// pinch / mousewheel - just zooming to center
			$zoomDragTranslate = boundTranslateValues($zoomDragTranslate)
			return
		}

		let { x, y, width, height } = e.target.getBoundingClientRect()

		// distance clicked from center of image
		let offsetX = e.clientX - x - width / 2
		let offsetY = e.clientY - y - height / 2

		x = offsetX * -1 * (newWidth / width) + offsetX
		y = offsetY * -1 * (newHeight / height) + offsetY

		$zoomDragTranslate = boundTranslateValues([x, y])
	}

	const onMousewheel = (e) => {
		// return if scrolling past inline gallery w/ wheel
		if (inline && !$zoomed) {
			return
		}
		e.preventDefault()
		// change zoom on wheel
		if (e.deltaY < 0) {
			changeZoom(e, 0.2)
		} else {
			changeZoom(e, -0.2)
		}
	}

	const getPointerPosition = (e) => [e.clientX, e.clientY]

	// on drag start, store initial position and image translate values
	const onPointerDown = (e) => {
		// don't run if right click
		if (e.button !== 2) {
			e.preventDefault()
			pointerDown = true
			eventCache.push(e)
			let [x, y] = getPointerPosition(e)
			dragStartX = x
			dragStartY = y
			dragStartTranslateX = $zoomDragTranslate[0]
			dragStartTranslateY = $zoomDragTranslate[1]
		}
	}

	// let pinch
	// on drag, update image translate val
	const onPointerMove = (e) => {
		// e.preventDefault()

		if (eventCache.length > 1) {
			isPinch = true
			pointerDown = false
			return handlePinch(e)
		}

		if (cancelEvents || !pointerDown) {
			return
		}

		let [x, y] = getPointerPosition(e)

		// store positions for inertia
		dragPositions.push({ x, y })

		// overall drag diff from start location
		x = x - dragStartX
		y = y - dragStartY

		// handle unzoomed left / right / up swipes
		if (!$zoomed) {
			// previous if swipe left
			if (x > 40) {
				prev()
				cancelEvents = true
			}
			// next if swipe right
			if (x < -40) {
				next()
				cancelEvents = true
			}
			// close if swipe up (don't close if inline)
			if (y < -90) {
				close()
				cancelEvents = true
			}
		}

		// prevent inline from zooming on finger scroll
		// hasDragged = inline

		// image drag when zoomed
		if ($zoomed && Math.hypot(x, y) > 10) {
			hasDragged = true
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
		let [p1, p2] = eventCache
		let dx = p1.clientX - p2.clientX
		let dy = p1.clientY - p2.clientY
		let curDiff = Math.hypot(dx, dy)

		if (!prevDiff) {
			prevDiff = curDiff
		}

		// scale image
		changeZoom(e, (prevDiff - curDiff) * -0.02)

		// Cache the distance for the next move event
		prevDiff = curDiff
	}

	// on mouse / touch end, set pointerDown to false
	const onPointerUp = (e) => {
		// remove event from event cache
		eventCache = eventCache.filter((ev) => ev.pointerId != e.pointerId)

		if (isPinch) {
			// set isPinch to false after second finger lifts
			isPinch = eventCache.length ? true : false
			prevDiff = 0
			return
		}

		// make sure pointer events don't carry over to next image
		if (cancelEvents || !pointerDown) {
			return
		}

		pointerDown = false

		if (!smallScreen) {
			// if largescreen
			// single tap zooms in / out
			if ($zoomed) {
				hasDragged || changeZoom(e, -5)
			} else {
				// zoom in if not zoomed and drag scrolling page
				dragPositions.length < 3 && !$zoomed && changeZoom(e)
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
			$zoomDragTranslate = boundTranslateValues(coords)
		}

		// reset pointer states
		hasDragged = false
		// reset dragPositions
		dragPositions = []
	}

	// handle window resize
	const onResize = () => {
		calculatedDimensions = calculateDimensions(naturalWidth, naturalHeight)
		// adjust image only if not smaller container
		// some mobile browsers trigger resize constantly if dragging / pinching
		if (!smallScreen) {
			$imageDimensions = calculatedDimensions
			$zoomDragTranslate = [0, 0]
		}
	}

	const onMount = () => {
		loadImage(activeItem).then(() => {
			loaded = true
			preloadNext()
		})
	}
</script>

<svelte:window on:resize={() => setTimeout(onResize, 0)} />

<div
	use:onMount
	class="bp-item bp-img"
	class:dragging={pointerDown}
	style="
		width:{$imageDimensions[0]}px;
		height:{$imageDimensions[1]}px
	"
>
	<div
		style="
			background-image:url({thumb});
			transform:translate3d({$zoomDragTranslate[0]}px, {$zoomDragTranslate[1]}px, 0px)
		"
		on:wheel={onMousewheel}
		on:pointerdown={onPointerDown}
		on:pointermove={onPointerMove}
		on:pointerup={onPointerUp}
		on:pointercancel={onPointerUp}
	>
		<Loading {thumb} {loaded} />
		{#if loaded}
			<img src={img} {alt} out:fade />
		{/if}
	</div>
</div>
