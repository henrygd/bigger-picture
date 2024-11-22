[npm-image]: https://flat.badgen.net/npm/v/bigger-picture?color=blue
[npm-url]: https://www.npmjs.com/package/bigger-picture
[size-image]: https://flat.badgen.net/static/gzip%20size/8.4%20KB/green

<!-- [size-image]: https://flat.badgen.net/badgesize/gzip/henrygd/bigger-picture/master/dist/bigger-picture.min.mjs?color=green -->

[license-image]: https://flat.badgen.net/github/license/henrygd/bigger-picture?color=purple
[license-url]: /license

# Bigger Picture

[![npm][npm-image]][npm-url] ![File Size][size-image] [![MIT license][license-image]][license-url]

Pretty good JavaScript lightbox gallery with a small footprint. Demo: https://biggerpicture.henrygd.me

https://user-images.githubusercontent.com/8519632/165216178-bd9a0b03-6ee5-42fd-b303-f92d281eb494.mp4

## Features

- **High Performance** - Smooth even with huge images, especially if using srcset.
- **Lightweight** - Less than half the size of lightGallery or PhotoSwipe (the king - not bashing it).
- **Zoomable** - Click, wheel, or pinch to zoom photos up to native resolution.
- **Responsive images** - Pass in a srcset value and Bigger Picture will handle the rest.
- **Video, audio, iframe, and html support** - No need for multiple libraries, plugins, or hacky workarounds.
- **Inline galleries and custom layouts** - Bigger Picture can be mounted anywhere and has an easy-to-use API.
- **Accessible** - Supports alt text, image / video captions, custom HTML attributes, keyboard navigation, respects prefers-reduced-motion, and manages focus.
- **Free software** - MIT licensed. Do whatever you want with it, just don't be an asshole please.

## Install

```
npm install bigger-picture
```

Add the required [CSS](dist/bigger-picture.css) or [SCSS](dist/bigger-picture.scss) to your project. You can `import "bigger-picture/css"` to avoid manually replacing styles when you update.

Alternatively, you can load from a CDN like [jsDelivr](https://www.jsdelivr.com/package/npm/bigger-picture?path=dist).

## Usage

This is a very basic example using HTML to supply data. You don't need to initialize more than once unless you want multiple galleries with different targets.

For passing data via object, see [Passing Item Data via Object](#passing-item-data-via-object).

Using Svelte? You can save a few bytes in your bundle. See [Usage with Svelte](#usage-with-svelte).

[![Edit bigger-picture-basic-gallery](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/bigger-picture-basic-gallery-o4kb82?fontsize=14&hidenavigation=1&theme=dark)

```js
import BiggerPicture from 'bigger-picture'

// initialize
let bp = BiggerPicture({
  target: document.body,
})

// open (will be a child of the target element above)
bp.open({
  items: document.querySelectorAll('#images a'),
})
```

```html
<div id="images">
  <a
    href="example.jpg"
    data-img="example.jpg"
    data-thumb="example_thumb.jpg"
    data-alt="Example"
    data-height="2500"
    data-width="1667"
  >
    <img src="example_thumb.jpg" alt="Example" />
  </a>
</div>
```

## Methods

### open([options](#options))

Opens the lightbox.

### close

Closes the lightbox.

### next

Changes to next item in gallery.

### prev

Changes to previous item in gallery.

### setPosition(position)

Changes to `position` item in gallery (zero-indexed).

## Options

### items

Type: `NodeList` or `Node` or `Array`

The data source for the displayed items. See [Item Properties](#item-properties) for details.

If using NodeList or Node, the information is passed via data attributes. If using Array, the information is passed via object.

### el

Type: `Node`<br>
Default: `undefined`

If the specified node matches a node in `items` (or matches the `element` value on an item if using an array), the gallery will start at that position. For example, you could use this inside a click handler by passing `event.target`. (See [codesandbox demo](https://codesandbox.io/s/bigger-picture-basic-gallery-o4kb82) for example.)

### position

Type: `number`<br>
Default: `0`

Start position of gallery. If using `el` this will be ignored.

> Note: This number is zero-indexed. The third item would be position 2.

### scale

Type: `number`<br>
Default: `0.99`

Controls the size of the displayed item. Use `1` to fill item to screen edges.

### intro

Type: `string`<br>
Default: `undefined`

Overrides the default intro animation. Currently `fadeup` is the only alternative.

### inline

Type: `boolean`<br>
Default: `false`

Specifies that the lightbox is inline. Interaction events are modified to avoid hijacking scroll and tab press.

> Note: The container element for an inline gallery should be set to position: relative

### noClose

Type: `boolean`<br>
Default: `false`

Hides the close button and prevents the lightbox from closing unless the [`close`](#close) method is called. Recommended to use in combination with an inline gallery.

### noPinch

Type: `function`<br>

Return a truthy value to disable pinch zoom. Function is executed at the time of the pinch. Supplies `container` - the gallery's wrapper element.

```js
bp.open({
  noPinch: (container) => container.clientWidth < 800,
})
```

### focusWrap

Type: `node`

Specify wrapper element to trap focus within on tab press. Useful when mounting a gallery inside a custom layout.

### maxZoom

Type: `number`<br>
Default: `10`

Restricts an image's maximum zoom to `maxZoom` times the starting size, even if the item's `width` / `height` is larger. For example, a `maxZoom` of 2 on an image that starts at 800px width would limit the image to a maximum zoom of 1600px width. A `maxZoom` of 1 would prevent zooming entirely.

> Note: If `maxZoom` is set on an individual item it will override the value set in options.

### onOpen

Type: `function`

Executes just before intro animation. Supplies `container` - the gallery's wrapper element, and `activeItem` - an object containing the currently displayed item's data.

```js
bp.open({
  onOpen: (container) => container.classList.add('custom-class'),
})
```

### onUpdate

Type: `function`

Executes just after the active item is updated. Supplies `container` and `activeItem`.

```js
bp.open({
  onUpdate(container, activeItem) {
    console.log('container', container)
    console.log('activeItem', activeItem)
  },
})
```

### onClose

Type: `function`

Executes just before outro animation. Supplies `container` and `activeItem`.

### onClosed

Type: `function`

Executes just after the lightbox has been closed and removed from the page.

### onResize

Type: `function`

Executes when the dimensions of the gallery (not the window) are changed. Supplies `container` and `activeItem`.

### onImageClick

Type: `function`

Executes when an image is clicked. Return a truthy value to prevent zooming. Supplies `container` and `activeItem`.

This method was added to make it easier to open a full screen instance when an image is clicked within an inline gallery ([example CodeSandbox](https://codesandbox.io/s/bp-inline-second-instance-forked-ezfzfv)), but could be used for other purposes.

### onError

Type: `function`

Executes if an error is thrown when loading an image, audio, or video item. Supplies `container`, `activeItem` and `error`.

## Item Properties

### width

Type: `number` or `string`<br>
Default: `1920`

Largest possible width of media item in pixels. Not required for HTML, which can be sized via CSS.

### height

Type: `number` or `string`<br>
Default: `1080`

Largest possible height of media item in pixels. Not required for HTML, which can be sized via CSS.

### thumb

Type: `string`

URL or path to image used for thumbnail displayed before media loads.

### img

Type: `string`

URL or path to full image. Can be a `srcset` value.

When using `srcset`, the `sizes` value will update automatically when an image is zoomed. You may override this behavior by setting the [`sizes`](#sizes) value.

### iframe

Type: `string`

URL or path to iframe source

### sources

Type: `Array` or `string`

For native video and audio, an array of objects specifying [`src`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-src) (required) and [`type`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/source#attr-type) (optional). A string may be used if it is JSON parsable. Each object will create a `source` element, and all key / value pairs in the object will be added as attributes.

<!-- prettier-ignore -->
```html
<div data-sources='[{"src": "example.webm", "type": "video/webm"}, {"src": "example.mp4", "type": "video/mp4"}]'>
```

### html

Type: `string`

HTML that will be rendered in the container. When using HTML, please control dimensions with CSS. No need to pass `width` or `height`.

For advanced use, you can pass an empty string, then mount a component using the [`onOpen`](#onopen) method:

```js
// mounting svelte component (firewatch example from demo site)
onOpen(container) {
  new Firewatch({
    target: container.querySelector('.bp-html'),
  })
},
```

### attr

Type: `object` or `string`

Add or override default attributes on the `<img>`, `<iframe>`, `<video>`, or `<audio>` elements.

<!-- prettier-ignore -->
```html
<div data-attr='{"credentialless": true, "referrerpolicy": "no-referrer"}'>
```

### alt

Type: `string`

Image alternative text

### title

Type: `string`

Title attribute for iframes

### caption

Type: `string`

Text to be displayed using built in caption. You may pass html tags and styles can be overriden via CSS.

### sizes

Type: `string`

Sets the sizes attribute if you're using `srcset`.

### maxZoom

Type: `number`<br>
Default: `10`

Restricts an image's maximum zoom to `maxZoom` times the starting size, even if the item's `width` / `height` is larger. For example, a `maxZoom` of 2 on an image that starts at 800px width would limit the image to a maximum zoom of 1600px width. A `maxZoom` of 1 would prevent zooming entirely.

> Note: If `maxZoom` is set on an individual item it will override the value set in options. Attribute name is `data-max-zoom`.

### tracks

Type: `string` or `Array`

Array of text track data to use with videos. String option is just a stringified array.

Below is an example for passing English and Spanish captions. See the [MDN page on track elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track) for more information.

<!-- prettier-ignore -->
```html
<div data-tracks='[{"label": "English", "kind": "captions", "srclang": "en", "src": "en.vtt", "default": "true"}, {"label": "Español", "kind": "captions", "srclang": "es", "src": "es.vtt"}]'></div>
```

## Passing Item Data via Object

To control the default open / close animation, also add a property `element` to each item that contains a node on the page. The active item's `element` will be where the animation opens from / closes to. If you're not using the default scale animation, this is not needed.

```js
bp.open({
  items: [
    {
      img: 'example.jpg',
      thumb: 'example_thumb.jpg',
      alt: 'Example',
      height: 2500,
      width: 1667,
      // if you're using the default intro animation
      element: node,
    },
  ],
})
```

## Usage with Svelte

Use the source `.svelte` files directly by importing `bigger-picture/svelte`. This will decrease the size of the library by 20 to 30 percent in most cases.

```js
import BiggerPicture from 'bigger-picture/svelte'
```

### Svelte 5 compatibility

This library was made with Svelte 4, so use the `compatibility.componentApi` compiler option to allow backwards compatibility.

If I have time, I'll release a new major version with Svelte 5.

```js
/// svelte.config.js
export default {
  compilerOptions: {
    compatibility: {
      componentApi: 4,
    },
  },
}
```

## License

MIT
