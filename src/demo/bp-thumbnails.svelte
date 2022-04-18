<script>
	import BiggerPicture from '../bigger-picture.svelte'
	import { tweened } from 'svelte/motion'
	import { fade } from 'svelte/transition'
	import { cubicOut } from 'svelte/easing'
	import { prefersReducedMotion } from '../stores'

	let opts

	let bp
	let bpItems = []
	let position

	let thumbsWidth
	let containerWidth
	let translate = tweened(0, {
		easing: cubicOut,
		duration: prefersReducedMotion ? 0 : 250,
	})
	let initialTranslate = 0
	let isPointerDown, pointerDownPos, hasDragged
	let dragPositions = []
	let focusWrap

	$: if (position) {
		// make sure button is in view when position updates
		setTimeout(scrollToButton, 0)
	}

	export const open = (options) => {
		opts = options
	}

	function boundTranslate(int) {
		if (int >= 0) {
			int = 0
		} else if (int < containerWidth - thumbsWidth - 1) {
			int = containerWidth - thumbsWidth - 1
		}
		return int
	}

	// moves active thumb button into view
	function scrollToButton(button) {
		// set button to active
		let activeBtn = button || focusWrap.querySelector('.active')
		// move button into view if off screen (changing translate value)
		let { left, right, width } = activeBtn.getBoundingClientRect()
		let margin = 3
		let { offsetLeft } = activeBtn
		if (left + width > containerWidth) {
			$translate = boundTranslate(
				offsetLeft * -1 - width + containerWidth - margin
			)
		} else if (right - width < 0) {
			$translate = boundTranslate(offsetLeft * -1 + margin)
		}
	}

	function pointerDown(e) {
		if (thumbsWidth < containerWidth) {
			return
		}
		let { clientX } = e
		isPointerDown = true
		pointerDownPos = clientX
	}

	function pointerMove(e) {
		if (isPointerDown) {
			let { clientX } = e
			let dragAmount = (pointerDownPos - clientX) * -1
			if (hasDragged) {
				translate.set(boundTranslate(initialTranslate + dragAmount), {
					duration: 0,
				})
				dragPositions.push(clientX)
			} else {
				hasDragged = Math.abs(dragAmount) > 5
			}
		}
	}
	function pointerUp() {
		if (hasDragged) {
			// drag inertia
			dragPositions = dragPositions.slice(-3)
			let xDiff = dragPositions[1] - dragPositions[2]
			xDiff = dragPositions[0] - dragPositions[2]
			if (Math.abs(xDiff) > 5) {
				$translate = boundTranslate($translate - xDiff * 5)
			}
		}
		dragPositions = []
		isPointerDown = hasDragged = false
		initialTranslate = $translate
	}

	const onMount = (bpWrap) => {
		bp = new BiggerPicture({
			target: bpWrap,
			props: {
				target: bpWrap,
			},
		})
		bp.open({
			...opts,
			focusWrap,
			onOpen: () => (bpItems = bp.items),
			onUpdate(container, activeItem) {
				position = activeItem.i
			},
			onClose: () => (opts = null),
		})
	}
</script>

<svelte:window on:resize={() => ($translate = 0)} />

{#if opts}
	<div
		class="thumbnail-wrap"
		bind:this={focusWrap}
		bind:clientWidth={containerWidth}
		on:pointermove={pointerMove}
		on:pointerup={pointerUp}
		on:pointercancel={pointerUp}
	>
		<div class="thumbnail-bp" use:onMount />
		<div
			class="thumbnails"
			transition:fade={{
				easing: cubicOut,
				duration: prefersReducedMotion ? 0 : 480,
			}}
		>
			<div
				style="transform: translatex({$translate}px)"
				bind:clientWidth={thumbsWidth}
				on:pointerdown={pointerDown}
			>
				<div>
					{#each bpItems as element (element.i)}
						<button
							title={element.alt}
							aria-label={element.alt}
							style="background-image:url({element.thumb})"
							class:active={element.i === position}
							on:focus={(e) => scrollToButton(e.target)}
							on:pointerup={() => !hasDragged && bp.setPosition(element.i)}
							on:keyup={(e) => e.key === 'Enter' && bp.setPosition(element.i)}
						/>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
