import { writable } from 'svelte/store'

/** true if gallery is in the process of closing */
export const closing = writable(0)

/** true if image is currently zoomed past starting size */
export const zoomed = writable(0)

/** store if user prefers reduced motion  */
export const prefersReducedMotion = matchMedia(
	'(prefers-reduced-motion: reduce)'
).matches
