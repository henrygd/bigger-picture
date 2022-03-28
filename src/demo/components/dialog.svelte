<script>
	export let bp
</script>

<div class="dialog">
	<span />
	<h2>Use location services?</h2>
	<p>
		In order to give directional instructions, we kindly ask you to turn on the
		location services.
	</p>
	<div>
		<button on:click={bp.close}>Close</button>
		<button on:click={bp.close} class="cta">Confirm</button>
	</div>
</div>
