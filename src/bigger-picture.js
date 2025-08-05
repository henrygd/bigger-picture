import BiggerPicture from './bigger-picture.svelte'

/**
 * Initializes BiggerPicture and assigns provided options to a props property
 *
 * @param {{target: HTMLElement}} options
 * @returns BiggerPicture instance
 */
export default function (options) {
	if (typeof options !== 'object') {
		options = {
			target: document.body
		};
	}
	return new BiggerPicture({
		...options,
		props: options,
	})
}
