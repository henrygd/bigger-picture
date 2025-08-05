<script>
	import { tweened } from 'svelte/motion';
	import { fly } from 'svelte/transition';
	import { defaultTweenOptions } from '../stores.js';

	export let items;
	export let position;
	export let setPosition;

	let thumbsWidth;
	let thumbsPanel;
	let thumbsPanelWidth;
	let initialTranslate = 0;
	let thumbsTranslate = tweened(0, defaultTweenOptions(250));

	let isPointerDown, pointerDownX, hasDragged;

	let dragPositions = [];

	const scrollToButton = (button) => {

		const activeBtn = button || thumbsPanel?.querySelector('.active');

		if (!activeBtn) {
			return;
		}
		let { left, right, width } = activeBtn.getBoundingClientRect();
		let margin = 3;
		let { offsetLeft } = activeBtn;
		if (left + width > thumbsPanelWidth) {
			$thumbsTranslate = boundTranslate(-offsetLeft - width + thumbsPanelWidth - margin);
		} else if (right - width < 0) {
			$thumbsTranslate = boundTranslate(-offsetLeft + margin);
		}

		initialTranslate = $thumbsTranslate;

	};

	const boundTranslate = (int) => {
		if (int >= 0) {
			int = 0;
		} else if (int < thumbsPanelWidth - thumbsWidth - 1) {
			int = thumbsPanelWidth - thumbsWidth - 1;
		}
		return int;
	};

	const pointerDown = (e) => {
		if (thumbsWidth >= thumbsPanelWidth) {
			isPointerDown = true;
			pointerDownX = e.clientX;
		}
	};

	const pointerMove = (e) => {
		if (isPointerDown) {
			let dragAmount = -(pointerDownX - e.clientX);
			if (hasDragged) {
				thumbsTranslate.set(boundTranslate(initialTranslate + dragAmount), {
					duration: 0
				});
				dragPositions.push(e.clientX);
			} else {
				hasDragged = Math.abs(dragAmount) > 5;
			}
		}
	};

	const pointerUp = () => {
		if (hasDragged) {
			dragPositions = dragPositions.slice(-3);
			if (dragPositions.length > 1) {
				let xDiff = dragPositions[0] - dragPositions.pop();
				if (Math.abs(xDiff) > 5) {
					$thumbsTranslate = boundTranslate($thumbsTranslate - xDiff * 5);
				}
			}
		}
		dragPositions = [];
		isPointerDown = hasDragged = false;
		initialTranslate = $thumbsTranslate;
	};

	/**
	 * Scroll to an active position on external change
	 */
	$: if (position !== undefined) {
		setTimeout(() => scrollToButton());
	}

	/**
	 * Update dimensions on resize
	 */
	const thumbsActions = function(node) {

		thumbsPanel = node;

		const resizeObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				if (entry.target === thumbsPanel) {
					thumbsPanelWidth = entry.contentRect.width;
				} else {
					thumbsWidth = entry.contentRect.width;
				}
			}
		});

		resizeObserver.observe(node);

		return {
			destroy() {
				resizeObserver.unobserve(node);
			}
		};

	};

</script>

<div
	use:thumbsActions
	in:fly|global={defaultTweenOptions(500)}
	out:fly|global={defaultTweenOptions(500)}
	on:pointermove={pointerMove}
	on:pointerup={pointerUp}
	on:pointercancel={pointerUp}
	class="bp-thumbs"
>
	<div
		class="bp-thumbs-outer"
		style:transform="translateX({$thumbsTranslate}px)"
		on:pointerdown={pointerDown}
	>
		<div
			use:thumbsActions
			class="bp-thumbs-inner"
		>
			{#each items as item (item.i)}
				<button
					title={item.caption}
					aria-label={item.caption || `View image ${item.i + 1}`}
					style:background-image={item.thumb ? `url(${item.thumb})` : 'none'}
					class:active={item.i === position}
					on:focus={(e) => scrollToButton(e.target)}
					on:click={() => !hasDragged && setPosition(item.i)}
				></button>
			{/each}
		</div>
	</div>
</div>