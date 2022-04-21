let ro

export function resize(node) {
	if (!ro) {
		ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				entry.target.dispatchEvent(
					new CustomEvent('bp:resize', {
						detail: {
							cr: entry.contentRect,
						},
					})
				)
			}
		})
	}
	ro.observe(node)
	return {
		destroy() {
			ro.unobserve(node)
		},
	}
}
