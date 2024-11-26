interface options {
	/** The data source for the displayed items. See [Item Properties](https://github.com/henrygd/bigger-picture#item-properties) for details.
	 *
	 * If using NodeList or Node, the information is passed via data attributes. If using Array, the information is passed via object. */
	items: HTMLElement | HTMLCollection | NodeList | item[]
	/** If the specified node matches a node in `items` (or matches the `element` value on an item if using an array), the gallery will start at that position.
	 *
	 * For example, you could use this inside a click handler by passing `event.target`. (See [codesandbox demo](https://codesandbox.io/s/bigger-picture-basic-gallery-o4kb82) for example.) */
	el?: HTMLElement | EventTarget
	/** Start position of gallery (zero-indexed). If using `el` this will be ignored. */
	position?: number
	/** Controls the size of the displayed item. Use `1` to fill item to screen edges. */
	scale?: number
	/** Overrides the default intro animation. Currently `fadeup` is the only alternative. */
	intro?: string
	/** Specifies that the lightbox is inline. Interaction events are modified to avoid hijacking scroll and tab press. */
	inline?: boolean
	/** Hides the close button and prevents the lightbox from closing unless the [`close`](https://github.com/henrygd/bigger-picture#close) method is called. Recommended to use in combination with an inline gallery. */
	noClose?: boolean
	/** Return a truthy value to disable pinch zoom. Function is executed at the time of the pinch. Supplies `container` - the gallery's wrapper element.
	 *
	 * ```js
	 * bp.open({
	 *    noPinch: (container) => container.clientWidth < 800,
	 * })
	 * ```
	 */
	noPinch?: () => any
	/** Specify wrapper element to trap focus within on tab press. Useful when mounting a gallery inside a custom layout. */
	focusWrap?: HTMLElement | EventTarget
	/** Restricts an image's maximum zoom level to `maxZoom` times the starting size, even if the item's `width` / `height` is larger. For example, a `maxZoom` of 2 on an image that is 800px wide when zoomed out would limit the image to a maximum zoom of 1600px width. */
	maxZoom?: number
	/** Executes just before intro animation. Supplies `container` - the gallery's wrapper element, and `activeItem` - an object containing the currently displayed item's data. */
	onOpen?: (container: HTMLElement, activeItem: activeItem) => void
	/** Executes just after the active item is updated. Supplies `container` and `activeItem`. */
	onUpdate?: (container?: HTMLElement, activeItem?: activeItem) => void
	/** Executes just before outro animation. Supplies `container` and `activeItem`. */
	onClose?: (container?: HTMLElement, activeItem?: activeItem) => void
	/** Executes just after the lightbox has been closed and removed from the page. */
	onClosed?: () => void
	/** Executes when the dimensions of the gallery (not the window) are changed. Supplies `container` and `activeItem`. */
	onResize?: (container?: HTMLElement, activeItem?: activeItem) => void
	/** Executes when an image is clicked. Return a truthy value to prevent zooming. Supplies `container` and `activeItem`. */
	onImageClick?: (container?: HTMLElement, activeItem?: activeItem) => any
	/** Executes when an error is thrown when loading an item (image, audio, video or iframe). */
	onError?: (
		container?: HTMLElement,
		activeItem?: activeItem,
		error?: Error
	) => void
}

interface item {
	[key: string]: any
	/** Largest possible width of media item in pixels. Not required for HTML, which can be sized via CSS. */
	width?: string | number
	/** Largest possible height of media item in pixels. Not required for HTML, which can be sized via CSS. */
	height?: string | number
	/** URL or path to image used for thumbnail displayed before media loads. */
	thumb?: string
	/** URL or path to full image. Can be a `srcset` value.
	 *
	 * When using `srcset`, the `sizes` value will update automatically when an image is zoomed. You may override this behavior by setting the [`sizes`](https://github.com/henrygd/bigger-picture#sizes) value. */
	img?: string
	/** For native video and audio, an array of objects specifying [`src`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-src) (required) and [`type`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-type) (optional). A string may be used if it is JSON parsable. Each object will create a `source` element, and all key / value pairs in the object will be added as attributes. */
	sources?: object[] | string
	/** HTML that will be rendered in the container. When using HTML, please control dimensions with CSS. No need to pass `width` or `height`.
   * 
   * For advanced use, you can pass an empty string, then mount a component using the [`onOpen`](https://github.com/henrygd/bigger-picture#onopen) method:
   * 
   * ```js
   * // mounting svelte component (firewatch example from demo site)
   * onOpen(container) {
   *    new Firewatch({
   *      target: container.querySelector('.bp-html'),
   *    })
   * },
  ``` */
	html?: string
	/** Image alternative text */
	alt?: string
	/** URL or path to iframe source */
	iframe?: string
	/** Title attribute for iframes */
	title?: string
	/** Text to be displayed using built in caption. You may pass html tags and styles can be overriden via CSS. */
	caption?: string
	/** Sets the sizes attribute if you're using `srcset`. */
	sizes?: string
	/** Restricts an image's maximum zoom level to `maxZoom` times the starting size, even if the item's `width` / `height` is larger. For example, a `maxZoom` of 2 on an image that is 800px wide when zoomed out would limit the image to a maximum zoom of 1600px width.
	 *
	 * If `maxZoom` is set on an individual item it will override the value set in options. Attribute name is `data-max-zoom`. */
	maxZoom?: number
	/** Array of text track data to use with videos. String option is just a stringified array. See the [MDN page on track elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track) for more information. */
	tracks?: string | object[]
	/** To control the default open / close animation, add a property `element` to each item that contains a node on the page. The active item's `element` will be where the animation opens from / closes to. If you're not using the default scale animation, this is not needed. */
	element?: HTMLElement | EventTarget
	/** Object of attributes to add to the `<img>`, `<iframe>`, `<video>`, `<audio>` elements. */
	attr?: Record<string, string | boolean> | string
}

export interface activeItem extends item {
	/** Read or set zoom state */
	zoom?: boolean
}

export interface BiggerPictureInstance {
	/** Opens the instance. */
	open: (options: options) => void
	/** Closes the lightbox. */
	close: () => void
	/** Changes to next item in gallery. */
	next: () => void
	/** Changes to previous item in gallery. */
	prev: () => void
	/** Changes to `position` item in gallery (zero-indexed). */
	setPosition: (position: number) => void
	/** Array of all items in currently active gallery */
	items: item[]
	/** Gallery target */
	target: HTMLElement
}

interface initObject {
	/** Specifies parent element inside which the gallery will be mounted */
	target: HTMLElement
}

/** Initializes BiggerPicture instance */
declare function BiggerPicture(options: initObject): BiggerPictureInstance

export default BiggerPicture
