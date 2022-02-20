// https://github.com/henrygd/hide-show-scroll

let { documentElement: html, body } = document
let defaultHtmlOverflow, defaultBodyOverflow

export const hideScroll = () => {
	// store existing overflow style
	if (window.innerWidth - html.clientWidth) {
		defaultHtmlOverflow =
			defaultHtmlOverflow || getComputedStyle(html).overflowY
		defaultBodyOverflow =
			defaultBodyOverflow || getComputedStyle(body).overflowY
		// hide overflow
		html.style.overflowY = 'hidden'
		body.style.overflowY = 'scroll'
	}
}

export const showScroll = () => {
	// show overflow
	html.style.overflowY = defaultHtmlOverflow
	body.style.overflowY = defaultHtmlOverflow
}
