<script>
	import BiggerPicture from '../bigger-picture.svelte'
	import { fade } from 'svelte/transition'
	import { cubicOut } from 'svelte/easing'

	let opts

	let bp, close
	let bpItems = []

	export const open = (options) => {
		opts = options
	}

	const control = (bpWrap) => {
		if (!bp) {
			bp = new BiggerPicture({
				target: bpWrap,
				props: {
					target: bpWrap,
				},
			})
		}
		bp.open({
			...opts,
			onUpdate: () => {
				bpItems = bp.items
				setTimeout(() => {
					let activeBtn = document.querySelector('.active')
					let { offsetLeft } = activeBtn
					activeBtn.parentNode.scrollLeft = offsetLeft
				}, 0)
				// setTimeout(() => {
				// 	document.querySelector('.active').scrollIntoView({
				// 		block: 'center',
				// 		inline: 'center',
				// 	})
				// }, 20)
			},
			onClose: () => (close = true),
		})
	}
</script>

{#if opts && !close}
	<div class="thumbnail-wrap">
		<div transition:fade={{ easing: cubicOut }} />
		<div class="thumbnail-bp" use:control />
		<div class="thumbnails" transition:fade={{ easing: cubicOut }}>
			<div>
				{#each bpItems as element (element.id)}
					<button
						style="background-image:url({element.thumb})"
						class:active={bp.position == element.id}
						on:click={() => (bp.position = element.id)}
					/>
				{/each}
			</div>
		</div>
	</div>
{/if}
