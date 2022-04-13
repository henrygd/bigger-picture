import { writable } from 'svelte/store'

export const closing = writable(0)
export const zoomed = writable(0)

// store if user prefers reduced motion
export const prefersReducedMotion = matchMedia(
	'(prefers-reduced-motion: reduce)'
).matches
