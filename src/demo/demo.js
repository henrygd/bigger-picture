// import BiggerPicture from '../bigger-picture'
import BiggerPicture from '../bigger-picture.svelte'
// import BiggerPictureThumbnails from './bp-thumbn/ails.svelte'
// import Macy from 'macy'
import FlexMasonry from 'flexmasonry/src/flexmasonry.js'

// import hideShowScroll from 'hide-show-scroll'
// import Prism from 'prismjs'
import plausible from './plausible'

let bodyBp, inlineBp

let imageLinks = document.querySelectorAll('#images a')
let vidIframeLinks = document.querySelectorAll('#vids a')
let htmlLinks = document.querySelectorAll('[data-html]')
let captionLinks = document.querySelectorAll('#captions a')

// masonry setup
handleMasonry(document.querySelectorAll('.masonry'))

// BiggerPicture setup
handleNodes(imageLinks)
handleNodes(captionLinks)
handleIndividualNodes(vidIframeLinks)

function handleNodes(nodes) {
	for (let i = 0; i < nodes.length; i++) {
		nodes[i].addEventListener('click', openBiggerPicture.bind(null, nodes))
	}
}
function handleIndividualNodes(nodes) {
	for (let i = 0; i < nodes.length; i++) {
		nodes[i].addEventListener('click', (e) =>
			openBiggerIndividualPicture(e, nodes[i])
		)
	}
}

function handleMasonry(sections) {
	FlexMasonry.init(sections, {
		breakpointCols: {
			'min-width: 701px': 3,
			'min-width: 0px': 2,
		},
	})
}

function openBiggerPicture(items, e) {
	e.preventDefault()
	if (!bodyBp) {
		bodyBp = new BiggerPicture({
			target: document.body,
			props: {
				target: document.body,
			},
		})
	}
	bodyBp.open({
		el: e.currentTarget,
		// position: 3,
		items,
		// scale: .8,
		// prevents close - only use if gallery is inline or you are manually controlling close
		// noClose: true,
		// onOpen: (container) => {
		// console.log('container', container)
		// container.classList.add('example')
		// },
		// onUpdate(container, activeItem) {
		// 	console.log('container', container)
		// 	console.log('activeItem', activeItem)
		// },
		// onResize: (activeItem) => {
		// 	console.log('resize', activeItem)
		// 	// bp.$set({ activeItem: { ...activeItem, ...{ width: 400 } } })
		// },
		// onOpen: hideShowScroll.hide,
		// onClosed: hideShowScroll.show,
	})
}

function openBiggerIndividualPicture(e, node) {
	e.preventDefault()
	if (!bodyBp) {
		bodyBp = new BiggerPicture({
			target: document.body,
			props: {
				target: document.body,
			},
		})
	}
	bodyBp.open({
		el: e.currentTarget,
		items: node,
	})
}

let inlineWrap = document.getElementById('inline_gallery')

function initInlineGallery() {
	if (!inlineBp) {
		inlineBp = new BiggerPicture({
			target: inlineWrap,
			props: {
				target: inlineWrap,
			},
		})
	}
	let items = Array.from(imageLinks).map((link, id) => ({
		...link.dataset,
		id,
	}))
	inlineBp.open({
		items,
		position: 2,
		scale: 1,
		intro: 'fadeup',
		noClose: true,
		inline: true,
	})
}

for (let i = 0; i < htmlLinks.length; i++) {
	htmlLinks[i].addEventListener('click', (e) => openHtml(e, htmlLinks[i]))
}

function openHtml(e, node) {
	e.preventDefault()
	if (!bodyBp) {
		bodyBp = new BiggerPicture({
			target: document.body,
			props: {
				target: document.body,
			},
		})
	}
	bodyBp.open({
		items: node,
		intro: 'fadeup',
	})
}

function createObserver() {
	let observer

	let options = {
		root: null,
		rootMargin: '0px',
		threshold: 0,
	}

	observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				observer.unobserve(entry.target)
				initInlineGallery()
			}
		})
	}, options)
	observer.observe(inlineWrap)
}

createObserver()

// plausible analytics
plausible()
