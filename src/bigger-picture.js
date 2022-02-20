import BiggerPicture from './bigger-picture.svelte'

export default (options) => {
	return new BiggerPicture({
		...options,
		intro: true,
		props: options,
	})
}
