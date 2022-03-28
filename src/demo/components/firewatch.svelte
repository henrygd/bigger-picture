<script>
	let layers = [0, 1, 2, 3, 4, 5, 6, 7, 8]

	let y

	let onScroll = (e) => (y = e.target.scrollTop)
</script>

<div class="firewatch">
	<div class="parallax-container">
		{#each layers as layer}
			<img
				style="transform: translate(0,{(-y * layer) / (layers.length - 1)}px)"
				src="https://www.firewatchgame.com/images/parallax/parallax{layer}.png"
				alt="parallax layer {layer}"
			/>
		{/each}
	</div>

	<span style="opacity: {1 - Math.max(0, y / 50)}"> scroll down </span>

	<div class="firewatch-scroll" on:scroll={onScroll}>
		<div class="foreground">
			You have scrolled {y} pixels
		</div>
	</div>
</div>
