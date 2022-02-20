<script>
	import Loading from './loading.svelte'

	export let activeItem
	export let calculateDimensions

	let loaded

	let { video, thumb, tracks = [], width, height } = activeItem

	// convert videos to array if passed via attribute
	video = Array.isArray(video) ? video : video.split(', ')

	// add type to videos
	video = video.map((src) => ({
		src,
		type: `video/${src.match(/.(\w+)$/)[1]}`,
	}))

	// convert tracks to array if passed via attribute
	tracks = Array.isArray(tracks) ? tracks : JSON.parse(tracks)

	let dimensions = calculateDimensions(width, height)
</script>

<svelte:window
	on:resize={() => (dimensions = calculateDimensions(width, height))}
/>

<!-- svelte-ignore a11y-media-has-caption -->

<div class="bp-item bp-vid">
	<video
		playsinline
		controls
		autoplay
		style="
			width:{dimensions[0]}px;
			height:{dimensions[1]}px
		"
		on:loadeddata={() => (loaded = true)}
	>
		{#each video as vid}
			<source {...vid} />
		{/each}
		{#each tracks as track}
			<track {...track} />
		{/each}
	</video>
	<Loading {thumb} {loaded} />
</div>
