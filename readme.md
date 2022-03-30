[npm-image]: https://flat.badgen.net/npm/v/bigger-picture
[npm-url]: https://www.npmjs.com/package/bigger-picture
[size-image]: https://flat.badgen.net/bundlephobia/minzip/bigger-picture?color=green
[cdn-url]: https://cdn.jsdelivr.net/npm/bigger-picture/dist/bigger-picture.mjs
[license-image]: https://flat.badgen.net/github/license/henrygd/bigger-picture?color=purple

# Bigger Picture

[![npm][npm-image]][npm-url] [![File Size][size-image]][cdn-url] ![License][license-image]

### IN DEVELOPMENT.

Feel free to test. API will likely change before release and things are a bit sloppy right now. Please post any feedback in the discussion section.

Demo: https://biggerpicture.henrygd.me

High performance JavaScript lightbox gallery with a small footprint. Supports images, videos, iframes, and html with no plugins necessary. Under 10kB gzip vanilla / much smaller if using svelte.

Flexible enough to intergrate into custom layouts and easily customizable via CSS.

https://user-images.githubusercontent.com/8519632/155907562-a8849399-51e4-4363-b377-b07b0fd12b82.mp4

## Install

```
npm install bigger-picture
```

Grab the [CSS](dist/bigger-picture.css) or [SCSS](dist/bigger-picture.scss) and add to your styles.

## Usage

This is a very basic example using HTML to supply data. You don't need to initialize more than once unless you want multiple galleries with different targets.

For passing data via object, see [Passing Item Data via Object](#passing-item-data-via-object).

Using Svelte? See [Usage with Svelte](#usage-with-svelte).

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

## Options

### items

Type: `NodeList` or `Node` or `Array`

The data source for the displayed items. See [Item Properties](#item-properties) for details.

If using NodeList or Node, the information is passed via data attributes. If using Array, the information is passed via object.

### el

Type: `Node`<br>
Default: `undefined`

If the specified node matches a node in `items`, the gallery will start at that position. For example, you could use this inside a click handler by passing `event.target`.

### position

Type: `number`<br>
Default: `0`

Start position of gallery. If using `el` this will be ignored.

> **Note:** This number is zero-indexed. The third item would be position 2.

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

Specifies that the lighbox is inline. Interaction events are modified to allow users to scroll past without hijacking.

### noClose

Type: `boolean`<br>
Default: `false`

Removes the close button and prevents the lightbox from closing. Recommended to use in combination with an inline gallery.

### onOpen

Type: `function`

Executes just before intro animation. Supplies `container` -- the wrapper element that is added to page.

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

Executes just before outro animation.

### onClosed

Type: `function`

Executes just after the lightbox has been closed and removed from the page.

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

URL or path to full size image.

### vid

Type: `string` or `Array`

URL or path to video(s). If using multiple sources, separate with a comma: `video.mp4, video.webm`.

If supplying data via Array, each video should be a separate string.

### html

Type: `string`

HTML that will be rendered in the container.

For advanced use, you can pass an empty string, then mount a component using the [`onOpen`](#onopen) or [`onUpdate`](#onupdate) methods:

```js
// mounting svelte component (firewatch example from demo site)
onOpen: (container) => {
  new Firewatch({
    target: container.querySelector('.bp-inner'),
  })
},
```

### alt

Type: `string`

Image alternative text

### caption

Type: `string`

Basic text to be displayed using built in caption (style can be altered via CSS).

### tracks

Type: `string` or `Array`

Array of text track data to use with videos. String option is just a stringified array.

Below is an example for passing English and Spanish captions. See the [MDN page on track elements](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/track) for more information.

<!-- prettier-ignore -->
```html
<div data-tracks='[{"label": "English", "kind": "captions", "srclang": "en", "src": "en.vtt", "default": "true"}, {"label": "Español", "kind": "captions", "srclang": "es", "src": "es.vtt"}]'></div>
```

## Passing Item Data via Object

If you want to track the default open / close animation, also add a property `element` that contains a node on the page. If you're not using the default intro animation, this is not needed.

```js
let items = [
  {
    img: 'example.jpg',
    thumb: 'example_thumb.jpg',
    alt: 'Example',
    height: 2500,
    width: 1667,
  },
]

bp.open({
  items,
})
```

## Usage with Svelte

This library was built using Svelte but doesn't require it to use.

For those who _are_ using it, please import the svelte component rather than the processed bundle. If you're using rollup or webpack, this should happen automatically.

The only difference in usage is that you need to use `new`, like you would with other Svelte components, and pass `target` in props, as below.

```js
let bp = new BiggerPicture({
  target: document.body,
  props: {
    target: document.body,
  },
})
```

## Internet Explorer Support TODO?

(may need to make an image.decode polyfill or workaround)

To use with IE, you need some polyfills. Easiest solution is to insert the script below in your html above where you're loading your other scripts. This will load the polyfills only in unsupported browsers.

```html
<script>
  if (!('customElements' in window)) {
    window.requestAnimationFrame = window.requestAnimationFrame.bind(window)
    window.setTimeout = window.setTimeout.bind(window)
    document.write(
      '<script src="https://cdn.jsdelivr.net/combine/npm/promise-polyfill@8.1.0/dist/polyfill.min.js,npm/classlist-polyfill@1.2.0/src/index.js,npm/mdn-polyfills@5.19.0/Array.prototype.fill.js,npm/@webcomponents/webcomponentsjs@2.4.1/webcomponents-bundle.min.js"><\/script>'
    )
  }
</script>
```

## License

MIT
