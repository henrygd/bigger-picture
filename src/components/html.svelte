<script>
	export let activeItem

	let { html, width } = activeItem
	let content = document.getElementById(html).outerHTML
</script>

<div class="bp-item bp-html" style="width:{width}px">
	{@html content}
</div>
