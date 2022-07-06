import { writable } from 'svelte/store'
import { cubicOut } from 'svelte/easing'

/** true if gallery is in the process of closing */
export const closing = writable(0)

/** store if user prefers reduced motion  */
export const prefersReducedMotion = globalThis.matchMedia?.(
	'(prefers-reduced-motion: reduce)'
).matches

/** default options for tweens / transitions */
export const defaultTweenOptions = (duration) => ({
	easing: cubicOut,
	duration: prefersReducedMotion ? 0 : duration,
})
