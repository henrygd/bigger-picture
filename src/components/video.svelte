<script>
	/*
	This file uses @html instead of each blocks simply because this 
	was the only place each blocks were being used and it inflated 
	the vanilla bundle size. If each blocks are eventually used 
	elsewhere, this file can be converted back to using each blocks.
	*/

	import Loading from './loading.svelte'

	export let activeItem
	export let calculateDimensions

	let loaded

	let { video, thumb, tracks = [], width, height } = activeItem

	// convert videos to array if passed via attribute
	video = Array.isArray(video) ? video : video.split(', ')

	// convert tracks to array if passed via attribute
	tracks = Array.isArray(tracks) ? tracks : JSON.parse(tracks)

	// make html string for video sources
	video = video.map(
		(src) => `<source src="${src}" type="video/${src.match(/.(\w+)$/)[1]}">`
	)

	// make html string for tracks
	tracks = tracks.map(
		(track) =>
			`<track${Object.keys(track).reduce(
				(str, key) => str + ` ${key}="${track[key]}"`,
				''
			)}>`
	)

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
		tabindex="0"
		style="
			width:{dimensions[0]}px;
			height:{dimensions[1]}px
		"
		on:canplay={() => (loaded = true)}
	>
		{@html video + tracks}
	</video>
	<Loading {thumb} {loaded} />
</div>
