import { writable } from 'svelte/store';
import { cubicOut } from 'svelte/easing';

/** true if gallery is in the process of closing */
export const closing = writable(false);

/** default options for tweens / transitions
 * @param {number} duration
 */
export const defaultTweenOptions = (duration) => ({
	easing: cubicOut,
	duration: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : duration
});

export const getThumbBackground = (activeItem) => !activeItem.thumb || `url(${activeItem.thumb})`;

/**
 * Adds attributes to the given node based on the provided object.
 *
 * @param {HTMLElement} node - The node to which attributes will be added
 * @param {Record<string, string | boolean> | string} attributes - The object containing key-value pairs of attributes to be added
 */
export const addAttributes = (node, attributes) => {
	if (!attributes) {
		return;
	}
	if (typeof attributes === 'string') {
		attributes = JSON.parse(attributes);
	}
	for (let key in attributes) {
		node.setAttribute(key, attributes[key]);
	}
};