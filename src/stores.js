import { writable } from 'svelte/store'
import { cubicOut } from 'svelte/easing'

/** true if gallery is in the process of closing */
export const closing = writable(0)

/** if user prefers reduced motion  */
export const prefersReducedMotion = globalThis.matchMedia?.(
	'(prefers-reduced-motion: reduce)'
).matches

/** default options for tweens / transitions
 * @param {number} duration
 */
export const defaultTweenOptions = (duration) => ({
	easing: cubicOut,
	duration: prefersReducedMotion ? 0 : duration,
})

export const getThumbBackground = (activeItem) =>
	!activeItem.thumb || `url(${activeItem.thumb})`

/**
 * Adds attributes to the given node based on the provided object.
 *
 * @param {HTMLElement} node - The node to which attributes will be added
 * @param {Record<string, string | boolean> | string} obj - The object containing key-value pairs of attributes to be added
 */
export const addAttributes = (node, obj) => {
	if (!obj) {
		return
	}
	if (typeof obj === 'string') {
		obj = JSON.parse(obj)
	}
	for (const key in obj) {
		node.setAttribute(key, obj[key])
	}
}
