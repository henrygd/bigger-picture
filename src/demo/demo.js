// import BiggerPicture from '../bigger-picture'
import BiggerPicture from '../bigger-picture.svelte'
import Firewatch from './components/firewatch.svelte'
import Tweet from './components/tweet.svelte'
import Dialog from './components/dialog.svelte'
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
let inlineWrap = document.getElementById('inline_gallery')

function initBodyBp() {
	if (!bodyBp) {
		bodyBp = new BiggerPicture({
			target: document.body,
			props: {
				target: document.body,
			},
		})
	}
}

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
	initBodyBp()
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
	initBodyBp()
	bodyBp.open({
		el: e.currentTarget,
		items: node,
	})
}

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

function openCode(e, node) {
	e.preventDefault()
	initBodyBp()
	bodyBp.open({
		el: node,
		items: [
			{
				html: document.getElementById(node.dataset.html).outerHTML,
				element: node,
			},
		],
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

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

// masonry setup
handleMasonry(document.querySelectorAll('.masonry'))

// BiggerPicture setup
handleNodes(imageLinks)
handleNodes(captionLinks)
handleIndividualNodes(vidIframeLinks)

// code modals
for (let i = 0; i < htmlLinks.length; i++) {
	htmlLinks[i].addEventListener('click', (e) => openCode(e, htmlLinks[i]))
}

// firewatch parallax
document.getElementById('firewatch').addEventListener('click', (e) => {
	e.preventDefault()
	initBodyBp()
	bodyBp.open({
		intro: 'fadeup',
		items: [{ html: '' }],
		onOpen: (container) => {
			new Firewatch({
				target: container.querySelector('.bp-inner'),
			})
		},
	})
})

// dialog modal example
document.getElementById('dialog').addEventListener('click', (e) => {
	e.preventDefault()
	initBodyBp()
	bodyBp.open({
		intro: 'fadeup',
		items: [{ html: '' }],
		onOpen: (container) => {
			container.querySelector('.bp-x').remove()
			container.classList.add('blur')
			new Dialog({
				target: container.querySelector('.bp-inner'),
				props: { bp: bodyBp },
			})
		},
	})
})

// tweet
document.getElementById('tweet').addEventListener('click', (e) => {
	e.preventDefault()
	initBodyBp()
	bodyBp.open({
		intro: 'fadeup',
		items: [{ html: '' }],
		onOpen: (container) => {
			new Tweet({
				target: container.querySelector('.bp-inner'),
			})
		},
	})
})

createObserver()

// plausible analytics
plausible()
