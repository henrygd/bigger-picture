/** @returns {void} */
function noop() {}

const identity = (x) => x;

/**
 * @template T
 * @template S
 * @param {T} tar
 * @param {S} src
 * @returns {T & S}
 */
function assign(tar, src) {
	// @ts-ignore
	for (const k in src) tar[k] = src[k];
	return /** @type {T & S} */ (tar);
}

function run(fn) {
	return fn();
}

/**
 * @param {Function[]} fns
 * @returns {void}
 */
function run_all(fns) {
	fns.forEach(run);
}

/**
 * @param {any} thing
 * @returns {thing is Function}
 */
function is_function(thing) {
	return typeof thing === 'function';
}

/** @returns {boolean} */
function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}

/** @returns {boolean} */
function not_equal(a, b) {
	return a != a ? b == b : a !== b;
}

/** @returns {boolean} */
function is_empty(obj) {
	return Object.keys(obj).length === 0;
}

function subscribe(store, ...callbacks) {
	if (store == null) {
		for (const callback of callbacks) {
			callback(undefined);
		}
		return noop;
	}
	const unsub = store.subscribe(...callbacks);
	return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}

/** @returns {void} */
function component_subscribe(component, store, callback) {
	component.$$.on_destroy.push(subscribe(store, callback));
}

function set_store_value(store, ret, value) {
	store.set(value);
	return ret;
}

function action_destroyer(action_result) {
	return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}

/** @param {number | string} value
 * @returns {[number, string]}
 */
function split_css_unit(value) {
	const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
	return split ? [parseFloat(split[1]), split[2] || 'px'] : [/** @type {number} */ (value), 'px'];
}

/** @type {() => number} */
let now = () => window.performance.now() ;

let raf = (cb) => requestAnimationFrame(cb) ;

const tasks = new Set();

/**
 * @param {number} now
 * @returns {void}
 */
function run_tasks(now) {
	tasks.forEach((task) => {
		if (!task.c(now)) {
			tasks.delete(task);
			task.f();
		}
	});
	if (tasks.size !== 0) raf(run_tasks);
}

/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 * @param {import('./private.js').TaskCallback} callback
 * @returns {import('./private.js').Task}
 */
function loop(callback) {
	/** @type {import('./private.js').TaskEntry} */
	let task;
	if (tasks.size === 0) raf(run_tasks);
	return {
		promise: new Promise((fulfill) => {
			tasks.add((task = { c: callback, f: fulfill }));
		}),
		abort() {
			tasks.delete(task);
		}
	};
}

/**
 * @param {Node} target
 * @param {Node} node
 * @returns {void}
 */
function append(target, node) {
	target.appendChild(node);
}

/**
 * @param {Node} node
 * @returns {CSSStyleSheet}
 */
function append_empty_stylesheet(node) {
	const style_element = element('style');
	// For transitions to work without 'style-src: unsafe-inline' Content Security Policy,
	// these empty tags need to be allowed with a hash as a workaround until we move to the Web Animations API.
	// Using the hash for the empty string (for an empty tag) works in all browsers except Safari.
	// So as a workaround for the workaround, when we append empty style tags we set their content to /* empty */.
	// The hash 'sha256-9OlNO0DNEeaVzHL4RZwCLsBHA8WBQ8toBp/4F5XV2nc=' will then work even in Safari.
	style_element.textContent = '/* empty */';
	append_stylesheet(document, style_element);
	return style_element.sheet;
}

/**
 * @param {ShadowRoot | Document} node
 * @param {HTMLStyleElement} style
 * @returns {CSSStyleSheet}
 */
function append_stylesheet(node, style) {
	append(/** @type {Document} */ (node).head || node, style);
	return style.sheet;
}

/**
 * @param {Node} target
 * @param {Node} node
 * @param {Node} [anchor]
 * @returns {void}
 */
function insert(target, node, anchor) {
	target.insertBefore(node, anchor || null);
}

/**
 * @param {Node} node
 * @returns {void}
 */
function detach(node) {
	if (node.parentNode) {
		node.parentNode.removeChild(node);
	}
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} name
 * @returns {HTMLElementTagNameMap[K]}
 */
function element(name) {
	return document.createElement(name);
}

/**
 * @param {string} data
 * @returns {Text}
 */
function text(data) {
	return document.createTextNode(data);
}

/**
 * @returns {Text} */
function empty() {
	return text('');
}

/**
 * @param {EventTarget} node
 * @param {string} event
 * @param {EventListenerOrEventListenerObject} handler
 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
 * @returns {() => void}
 */
function listen(node, event, handler, options) {
	node.addEventListener(event, handler, options);
	return () => node.removeEventListener(event, handler, options);
}

/**
 * @param {Element} node
 * @param {string} attribute
 * @param {string} [value]
 * @returns {void}
 */
function attr(node, attribute, value) {
	if (value == null) node.removeAttribute(attribute);
	else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}

/**
 * @returns {void} */
function set_style(node, key, value, important) {
	if (value == null) {
		node.style.removeProperty(key);
	} else {
		node.style.setProperty(key, value);
	}
}

/**
 * @returns {void} */
function toggle_class(element, name, toggle) {
	// The `!!` is required because an `undefined` flag means flipping the current state.
	element.classList.toggle(name, !!toggle);
}

/**
 * @template T
 * @param {string} type
 * @param {T} [detail]
 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
 * @returns {CustomEvent<T>}
 */
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
	return new CustomEvent(type, { detail, bubbles, cancelable });
}

/**
 * @typedef {Node & {
 * 	claim_order?: number;
 * 	hydrate_init?: true;
 * 	actual_end_child?: NodeEx;
 * 	childNodes: NodeListOf<NodeEx>;
 * }} NodeEx
 */

/** @typedef {ChildNode & NodeEx} ChildNodeEx */

/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

/**
 * @typedef {ChildNodeEx[] & {
 * 	claim_info?: {
 * 		last_index: number;
 * 		total_claimed: number;
 * 	};
 * }} ChildNodeArray
 */

// we need to store the information for multiple documents because a Svelte application could also contain iframes
// https://github.com/sveltejs/svelte/issues/3624
/** @type {Map<Document | ShadowRoot, import('./private.d.ts').StyleInformation>} */
const managed_styles = new Map();

let active = 0;

// https://github.com/darkskyapp/string-hash/blob/master/index.js
/**
 * @param {string} str
 * @returns {number}
 */
function hash(str) {
	let hash = 5381;
	let i = str.length;
	while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
	return hash >>> 0;
}

/**
 * @param {Document | ShadowRoot} doc
 * @param {Element & ElementCSSInlineStyle} node
 * @returns {{ stylesheet: any; rules: {}; }}
 */
function create_style_information(doc, node) {
	const info = { stylesheet: append_empty_stylesheet(), rules: {} };
	managed_styles.set(doc, info);
	return info;
}

/**
 * @param {Element & ElementCSSInlineStyle} node
 * @param {number} a
 * @param {number} b
 * @param {number} duration
 * @param {number} delay
 * @param {(t: number) => number} ease
 * @param {(t: number, u: number) => string} fn
 * @param {number} uid
 * @returns {string}
 */
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
	const step = 16.666 / duration;
	let keyframes = '{\n';
	for (let p = 0; p <= 1; p += step) {
		const t = a + (b - a) * ease(p);
		keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
	}
	const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
	const name = `_bp_${hash(rule)}_${uid}`;
	const doc = document;
	const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc);
	if (!rules[name]) {
		rules[name] = true;
		stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
	}
	const animation = node.style.animation || '';
	node.style.animation = `${
		animation ? `${animation}, ` : ''
	}${name} ${duration}ms linear ${delay}ms 1 both`;
	active += 1;
	return name;
}

/**
 * @param {Element & ElementCSSInlineStyle} node
 * @param {string} [name]
 * @returns {void}
 */
function delete_rule(node, name) {
	const previous = (node.style.animation || '').split(', ');
	const next = previous.filter(
		name
			? (anim) => anim.indexOf(name) < 0 // remove specific animation
			: (anim) => anim.indexOf('_bp') === -1 // remove all Svelte animations
	);
	const deleted = previous.length - next.length;
	if (deleted) {
		node.style.animation = next.join(', ');
		active -= deleted;
		if (!active) clear_rules();
	}
}

/** @returns {void} */
function clear_rules() {
	raf(() => {
		if (active) return;
		managed_styles.forEach((info) => {
			const { ownerNode } = info.stylesheet;
			// there is no ownerNode if it runs on jsdom.
			if (ownerNode) detach(ownerNode);
		});
		managed_styles.clear();
	});
}

let current_component;

/** @returns {void} */
function set_current_component(component) {
	current_component = component;
}

const dirty_components = [];
const binding_callbacks = [];

let render_callbacks = [];

const flush_callbacks = [];

const resolved_promise = /* @__PURE__ */ Promise.resolve();

let update_scheduled = false;

/** @returns {void} */
function schedule_update() {
	if (!update_scheduled) {
		update_scheduled = true;
		resolved_promise.then(flush);
	}
}

/** @returns {void} */
function add_render_callback(fn) {
	render_callbacks.push(fn);
}

// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();

let flushidx = 0; // Do *not* move this inside the flush() function

/** @returns {void} */
function flush() {
	// Do not reenter flush while dirty components are updated, as this can
	// result in an infinite loop. Instead, let the inner flush handle it.
	// Reentrancy is ok afterwards for bindings etc.
	if (flushidx !== 0) {
		return;
	}
	const saved_component = current_component;
	do {
		// first, call beforeUpdate functions
		// and update components
		try {
			while (flushidx < dirty_components.length) {
				const component = dirty_components[flushidx];
				flushidx++;
				set_current_component(component);
				update(component.$$);
			}
		} catch (e) {
			// reset dirty state to not end up in a deadlocked state and then rethrow
			dirty_components.length = 0;
			flushidx = 0;
			throw e;
		}
		set_current_component(null);
		dirty_components.length = 0;
		flushidx = 0;
		while (binding_callbacks.length) binding_callbacks.pop()();
		// then, once components are updated, call
		// afterUpdate functions. This may cause
		// subsequent updates...
		for (let i = 0; i < render_callbacks.length; i += 1) {
			const callback = render_callbacks[i];
			if (!seen_callbacks.has(callback)) {
				// ...so guard against infinite loops
				seen_callbacks.add(callback);
				callback();
			}
		}
		render_callbacks.length = 0;
	} while (dirty_components.length);
	while (flush_callbacks.length) {
		flush_callbacks.pop()();
	}
	update_scheduled = false;
	seen_callbacks.clear();
	set_current_component(saved_component);
}

/** @returns {void} */
function update($$) {
	if ($$.fragment !== null) {
		$$.update();
		run_all($$.before_update);
		const dirty = $$.dirty;
		$$.dirty = [-1];
		$$.fragment && $$.fragment.p($$.ctx, dirty);
		$$.after_update.forEach(add_render_callback);
	}
}

/**
 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
 * @param {Function[]} fns
 * @returns {void}
 */
function flush_render_callbacks(fns) {
	const filtered = [];
	const targets = [];
	render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
	targets.forEach((c) => c());
	render_callbacks = filtered;
}

/**
 * @type {Promise<void> | null}
 */
let promise;

/**
 * @returns {Promise<void>}
 */
function wait() {
	if (!promise) {
		promise = Promise.resolve();
		promise.then(() => {
			promise = null;
		});
	}
	return promise;
}

/**
 * @param {Element} node
 * @param {INTRO | OUTRO | boolean} direction
 * @param {'start' | 'end'} kind
 * @returns {void}
 */
function dispatch(node, direction, kind) {
	node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}

const outroing = new Set();

/**
 * @type {Outro}
 */
let outros;

/**
 * @returns {void} */
function group_outros() {
	outros = {
		r: 0,
		c: [],
		p: outros // parent group
	};
}

/**
 * @returns {void} */
function check_outros() {
	if (!outros.r) {
		run_all(outros.c);
	}
	outros = outros.p;
}

/**
 * @param {import('./private.js').Fragment} block
 * @param {0 | 1} [local]
 * @returns {void}
 */
function transition_in(block, local) {
	if (block && block.i) {
		outroing.delete(block);
		block.i(local);
	}
}

/**
 * @param {import('./private.js').Fragment} block
 * @param {0 | 1} local
 * @param {0 | 1} [detach]
 * @param {() => void} [callback]
 * @returns {void}
 */
function transition_out(block, local, detach, callback) {
	if (block && block.o) {
		if (outroing.has(block)) return;
		outroing.add(block);
		outros.c.push(() => {
			outroing.delete(block);
			if (callback) {
				if (detach) block.d(1);
				callback();
			}
		});
		block.o(local);
	} else if (callback) {
		callback();
	}
}

/**
 * @type {import('../transition/public.js').TransitionConfig}
 */
const null_transition = { duration: 0 };

/**
 * @param {Element & ElementCSSInlineStyle} node
 * @param {TransitionFn} fn
 * @param {any} params
 * @returns {{ start(): void; invalidate(): void; end(): void; }}
 */
function create_in_transition(node, fn, params) {
	/**
	 * @type {TransitionOptions} */
	const options = { direction: 'in' };
	let config = fn(node, params, options);
	let running = false;
	let animation_name;
	let task;
	let uid = 0;

	/**
	 * @returns {void} */
	function cleanup() {
		if (animation_name) delete_rule(node, animation_name);
	}

	/**
	 * @returns {void} */
	function go() {
		const {
			delay = 0,
			duration = 300,
			easing = identity,
			tick = noop,
			css
		} = config || null_transition;
		if (css) animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
		tick(0, 1);
		const start_time = now() + delay;
		const end_time = start_time + duration;
		if (task) task.abort();
		running = true;
		add_render_callback(() => dispatch(node, true, 'start'));
		task = loop((now) => {
			if (running) {
				if (now >= end_time) {
					tick(1, 0);
					dispatch(node, true, 'end');
					cleanup();
					return (running = false);
				}
				if (now >= start_time) {
					const t = easing((now - start_time) / duration);
					tick(t, 1 - t);
				}
			}
			return running;
		});
	}
	let started = false;
	return {
		start() {
			if (started) return;
			started = true;
			delete_rule(node);
			if (is_function(config)) {
				config = config(options);
				wait().then(go);
			} else {
				go();
			}
		},
		invalidate() {
			started = false;
		},
		end() {
			if (running) {
				cleanup();
				running = false;
			}
		}
	};
}

/**
 * @param {Element & ElementCSSInlineStyle} node
 * @param {TransitionFn} fn
 * @param {any} params
 * @returns {{ end(reset: any): void; }}
 */
function create_out_transition(node, fn, params) {
	/** @type {TransitionOptions} */
	const options = { direction: 'out' };
	let config = fn(node, params, options);
	let running = true;
	let animation_name;
	const group = outros;
	group.r += 1;
	/** @type {boolean} */
	let original_inert_value;

	/**
	 * @returns {void} */
	function go() {
		const {
			delay = 0,
			duration = 300,
			easing = identity,
			tick = noop,
			css
		} = config || null_transition;

		if (css) animation_name = create_rule(node, 1, 0, duration, delay, easing, css);

		const start_time = now() + delay;
		const end_time = start_time + duration;
		add_render_callback(() => dispatch(node, false, 'start'));

		if ('inert' in node) {
			original_inert_value = /** @type {HTMLElement} */ (node).inert;
			node.inert = true;
		}

		loop((now) => {
			if (running) {
				if (now >= end_time) {
					tick(0, 1);
					dispatch(node, false, 'end');
					if (!--group.r) {
						// this will result in `end()` being called,
						// so we don't need to clean up here
						run_all(group.c);
					}
					return false;
				}
				if (now >= start_time) {
					const t = easing((now - start_time) / duration);
					tick(1 - t, t);
				}
			}
			return running;
		});
	}

	if (is_function(config)) {
		wait().then(() => {
			// @ts-ignore
			config = config(options);
			go();
		});
	} else {
		go();
	}

	return {
		end(reset) {
			if (reset && 'inert' in node) {
				node.inert = original_inert_value;
			}
			if (reset && config.tick) {
				config.tick(1, 0);
			}
			if (running) {
				if (animation_name) delete_rule(node, animation_name);
				running = false;
			}
		}
	};
}

/** @typedef {1} INTRO */
/** @typedef {0} OUTRO */
/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

/**
 * @typedef {Object} Outro
 * @property {number} r
 * @property {Function[]} c
 * @property {Object} p
 */

/**
 * @typedef {Object} PendingProgram
 * @property {number} start
 * @property {INTRO|OUTRO} b
 * @property {Outro} [group]
 */

/**
 * @typedef {Object} Program
 * @property {number} a
 * @property {INTRO|OUTRO} b
 * @property {1|-1} d
 * @property {number} duration
 * @property {number} start
 * @property {number} end
 * @property {Outro} [group]
 */

// general each functions:

function ensure_array_like(array_like_or_iterator) {
	return array_like_or_iterator?.length !== undefined
		? array_like_or_iterator
		: Array.from(array_like_or_iterator);
}

// keyed each functions:

/** @returns {void} */
function destroy_block(block, lookup) {
	block.d(1);
	lookup.delete(block.key);
}

/** @returns {any[]} */
function update_keyed_each(
	old_blocks,
	dirty,
	get_key,
	dynamic,
	ctx,
	list,
	lookup,
	node,
	destroy,
	create_each_block,
	next,
	get_context
) {
	let o = old_blocks.length;
	let n = list.length;
	let i = o;
	const old_indexes = {};
	while (i--) old_indexes[old_blocks[i].key] = i;
	const new_blocks = [];
	const new_lookup = new Map();
	const deltas = new Map();
	const updates = [];
	i = n;
	while (i--) {
		const child_ctx = get_context(ctx, list, i);
		const key = get_key(child_ctx);
		let block = lookup.get(key);
		if (!block) {
			block = create_each_block(key, child_ctx);
			block.c();
		} else {
			// defer updates until all the DOM shuffling is done
			updates.push(() => block.p(child_ctx, dirty));
		}
		new_lookup.set(key, (new_blocks[i] = block));
		if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
	}
	const will_move = new Set();
	const did_move = new Set();
	/** @returns {void} */
	function insert(block) {
		transition_in(block, 1);
		block.m(node, next);
		lookup.set(block.key, block);
		next = block.first;
		n--;
	}
	while (o && n) {
		const new_block = new_blocks[n - 1];
		const old_block = old_blocks[o - 1];
		const new_key = new_block.key;
		const old_key = old_block.key;
		if (new_block === old_block) {
			// do nothing
			next = new_block.first;
			o--;
			n--;
		} else if (!new_lookup.has(old_key)) {
			// remove old block
			destroy(old_block, lookup);
			o--;
		} else if (!lookup.has(new_key) || will_move.has(new_key)) {
			insert(new_block);
		} else if (did_move.has(old_key)) {
			o--;
		} else if (deltas.get(new_key) > deltas.get(old_key)) {
			did_move.add(new_key);
			insert(new_block);
		} else {
			will_move.add(old_key);
			o--;
		}
	}
	while (o--) {
		const old_block = old_blocks[o];
		if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
	}
	while (n) insert(new_blocks[n - 1]);
	run_all(updates);
	return new_blocks;
}

/** @returns {void} */
function create_component(block) {
	block && block.c();
}

/** @returns {void} */
function mount_component(component, target, anchor) {
	const { fragment, after_update } = component.$$;
	fragment && fragment.m(target, anchor);
	// onMount happens before the initial afterUpdate
	add_render_callback(() => {
		const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
		// if the component was destroyed immediately
		// it will update the `$$.on_destroy` reference to `null`.
		// the destructured on_destroy may still reference to the old array
		if (component.$$.on_destroy) {
			component.$$.on_destroy.push(...new_on_destroy);
		} else {
			// Edge case - component was destroyed immediately,
			// most likely as a result of a binding initialising
			run_all(new_on_destroy);
		}
		component.$$.on_mount = [];
	});
	after_update.forEach(add_render_callback);
}

/** @returns {void} */
function destroy_component(component, detaching) {
	const $$ = component.$$;
	if ($$.fragment !== null) {
		flush_render_callbacks($$.after_update);
		run_all($$.on_destroy);
		$$.fragment && $$.fragment.d(detaching);
		// TODO null out other refs, including component.$$ (but need to
		// preserve final state?)
		$$.on_destroy = $$.fragment = null;
		$$.ctx = [];
	}
}

/** @returns {void} */
function make_dirty(component, i) {
	if (component.$$.dirty[0] === -1) {
		dirty_components.push(component);
		schedule_update();
		component.$$.dirty.fill(0);
	}
	component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
}

// TODO: Document the other params
/**
 * @param {SvelteComponent} component
 * @param {import('./public.js').ComponentConstructorOptions} options
 *
 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
 * This will be the `add_css` function from the compiled component.
 *
 * @returns {void}
 */
function init(
	component,
	options,
	instance,
	create_fragment,
	not_equal,
	props,
	append_styles = null,
	dirty = [-1]
) {
	const parent_component = current_component;
	set_current_component(component);
	/** @type {import('./private.js').T$$} */
	const $$ = (component.$$ = {
		fragment: null,
		ctx: [],
		// state
		props,
		update: noop,
		not_equal,
		bound: {},
		// lifecycle
		on_mount: [],
		on_destroy: [],
		on_disconnect: [],
		before_update: [],
		after_update: [],
		context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
		// everything else
		callbacks: {},
		dirty,
		skip_bound: false,
		root: options.target || parent_component.$$.root
	});
	append_styles && append_styles($$.root);
	let ready = false;
	$$.ctx = instance
		? instance(component, options.props || {}, (i, ret, ...rest) => {
				const value = rest.length ? rest[0] : ret;
				if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
					if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
					if (ready) make_dirty(component, i);
				}
				return ret;
		  })
		: [];
	$$.update();
	ready = true;
	run_all($$.before_update);
	// `false` as a special case of no DOM component
	$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
	if (options.target) {
		{
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			$$.fragment && $$.fragment.c();
		}
		mount_component(component, options.target, options.anchor);
		flush();
	}
	set_current_component(parent_component);
}

/**
 * Base class for Svelte components. Used when dev=false.
 *
 * @template {Record<string, any>} [Props=any]
 * @template {Record<string, any>} [Events=any]
 */
class SvelteComponent {
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$ = undefined;
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$set = undefined;

	/** @returns {void} */
	$destroy() {
		destroy_component(this, 1);
		this.$destroy = noop;
	}

	/**
	 * @template {Extract<keyof Events, string>} K
	 * @param {K} type
	 * @param {((e: Events[K]) => void) | null | undefined} callback
	 * @returns {() => void}
	 */
	$on(type, callback) {
		if (!is_function(callback)) {
			return noop;
		}
		const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
		callbacks.push(callback);
		return () => {
			const index = callbacks.indexOf(callback);
			if (index !== -1) callbacks.splice(index, 1);
		};
	}

	/**
	 * @param {Partial<Props>} props
	 * @returns {void}
	 */
	$set(props) {
		if (this.$$set && !is_empty(props)) {
			this.$$.skip_bound = true;
			this.$$set(props);
			this.$$.skip_bound = false;
		}
	}
}

/**
 * @typedef {Object} CustomElementPropDefinition
 * @property {string} [attribute]
 * @property {boolean} [reflect]
 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
 */

// generated during release, do not modify

const PUBLIC_VERSION = '4';

(window._bp || (window._bp = { v: new Set() })).v.add(PUBLIC_VERSION);

const subscriber_queue = [];

/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 *
 * https://svelte.dev/docs/svelte-store#writable
 * @template T
 * @param {T} [value] initial value
 * @param {import('./public.js').StartStopNotifier<T>} [start]
 * @returns {import('./public.js').Writable<T>}
 */
function writable(value, start = noop) {
	/** @type {import('./public.js').Unsubscriber} */
	let stop;
	/** @type {Set<import('./private.js').SubscribeInvalidateTuple<T>>} */
	const subscribers = new Set();
	/** @param {T} new_value
	 * @returns {void}
	 */
	function set(new_value) {
		if (safe_not_equal(value, new_value)) {
			value = new_value;
			if (stop) {
				// store is ready
				const run_queue = !subscriber_queue.length;
				for (const subscriber of subscribers) {
					subscriber[1]();
					subscriber_queue.push(subscriber, value);
				}
				if (run_queue) {
					for (let i = 0; i < subscriber_queue.length; i += 2) {
						subscriber_queue[i][0](subscriber_queue[i + 1]);
					}
					subscriber_queue.length = 0;
				}
			}
		}
	}

	/**
	 * @param {import('./public.js').Updater<T>} fn
	 * @returns {void}
	 */
	function update(fn) {
		set(fn(value));
	}

	/**
	 * @param {import('./public.js').Subscriber<T>} run
	 * @param {import('./private.js').Invalidator<T>} [invalidate]
	 * @returns {import('./public.js').Unsubscriber}
	 */
	function subscribe(run, invalidate = noop) {
		/** @type {import('./private.js').SubscribeInvalidateTuple<T>} */
		const subscriber = [run, invalidate];
		subscribers.add(subscriber);
		if (subscribers.size === 1) {
			stop = start(set, update) || noop;
		}
		run(value);
		return () => {
			subscribers.delete(subscriber);
			if (subscribers.size === 0 && stop) {
				stop();
				stop = null;
			}
		};
	}
	return { set, update, subscribe };
}

/*
Adapted from https://github.com/mattdesl
Distributed under MIT License https://github.com/mattdesl/eases/blob/master/LICENSE.md
*/

/**
 * https://svelte.dev/docs/svelte-easing
 * @param {number} t
 * @returns {number}
 */
function cubicOut(t) {
	const f = t - 1.0;
	return f * f * f + 1.0;
}

/** true if gallery is in the process of closing */
const closing = writable(false);

/** default options for tweens / transitions
 * @param {number} duration
 */
const defaultTweenOptions = (duration) => ({
	easing: cubicOut,
	duration: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : duration
});

const getThumbBackground = (activeItem) => !activeItem.thumb || `url(${activeItem.thumb})`;

/**
 * Adds attributes to the given node based on the provided object.
 *
 * @param {HTMLElement} node - The node to which attributes will be added
 * @param {Record<string, string | boolean> | string} attributes - The object containing key-value pairs of attributes to be added
 */
const addAttributes = (node, attributes) => {
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

/**
 * Animates the x and y positions and the opacity of an element. `in` transitions animate from the provided values, passed as parameters to the element's default values. `out` transitions animate from the element's default values to the provided values.
 *
 * https://svelte.dev/docs/svelte-transition#fly
 * @param {Element} node
 * @param {import('./public').FlyParams} [params]
 * @returns {import('./public').TransitionConfig}
 */
function fly(
	node,
	{ delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}
) {
	const style = getComputedStyle(node);
	const target_opacity = +style.opacity;
	const transform = style.transform === 'none' ? '' : style.transform;
	const od = target_opacity * (1 - opacity);
	const [xValue, xUnit] = split_css_unit(x);
	const [yValue, yUnit] = split_css_unit(y);
	return {
		delay,
		duration,
		easing,
		css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * xValue}${xUnit}, ${(1 - t) * yValue}${yUnit});
			opacity: ${target_opacity - od * u}`
	};
}

/** @returns {(t: any) => any} */
function get_interpolator(a, b) {
	if (a === b || a !== a) return () => a;
	const type = typeof a;
	if (Array.isArray(a)) {
		const arr = b.map((bi, i) => {
			return get_interpolator(a[i], bi);
		});
		return (t) => arr.map((fn) => fn(t));
	}
	if (type === 'number') {
		const delta = b - a;
		return (t) => a + t * delta;
	}
	
}

/**
 * A tweened store in Svelte is a special type of store that provides smooth transitions between state values over time.
 *
 * https://svelte.dev/docs/svelte-motion#tweened
 * @template T
 * @param {T} [value]
 * @param {import('./private.js').TweenedOptions<T>} [defaults]
 * @returns {import('./public.js').Tweened<T>}
 */
function tweened(value, defaults = {}) {
	const store = writable(value);
	/** @type {import('../internal/private.js').Task} */
	let task;
	let target_value = value;
	/**
	 * @param {T} new_value
	 * @param {import('./private.js').TweenedOptions<T>} [opts]
	 */
	function set(new_value, opts) {
		if (value == null) {
			store.set((value = new_value));
			return Promise.resolve();
		}
		target_value = new_value;
		let previous_task = task;
		let started = false;
		let {
			delay = 0,
			duration = 400,
			easing = identity,
			interpolate = get_interpolator
		} = assign(assign({}, defaults), opts);
		if (duration === 0) {
			if (previous_task) {
				previous_task.abort();
				previous_task = null;
			}
			store.set((value = target_value));
			return Promise.resolve();
		}
		const start = now() + delay;
		let fn;
		task = loop((now) => {
			if (now < start) return true;
			if (!started) {
				fn = interpolate(value, new_value);
				if (typeof duration === 'function') duration = duration(value, new_value);
				started = true;
			}
			if (previous_task) {
				previous_task.abort();
				previous_task = null;
			}
			const elapsed = now - start;
			if (elapsed > /** @type {number} */ (duration)) {
				store.set((value = new_value));
				return false;
			}
			// @ts-ignore
			store.set((value = fn(easing(elapsed / duration))));
			return true;
		});
		return task.promise;
	}
	return {
		set,
		update: (fn, opts) => set(fn(target_value, value), opts),
		subscribe: store.subscribe
	};
}

/* src\components\thumbs.svelte generated by Svelte v4.2.20 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[21] = list[i];
	return child_ctx;
}

// (134:3) {#each items as item (item.i)}
function create_each_block(key_1, ctx) {
	let button;
	let button_title_value;
	let button_aria_label_value;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[12](/*item*/ ctx[21]);
	}

	return {
		key: key_1,
		first: null,
		c() {
			button = element("button");
			attr(button, "title", button_title_value = /*item*/ ctx[21].caption);
			attr(button, "aria-label", button_aria_label_value = /*item*/ ctx[21].caption || `View image ${/*item*/ ctx[21].i + 1}`);
			toggle_class(button, "active", /*item*/ ctx[21].i === /*position*/ ctx[1]);

			set_style(button, "background-image", /*item*/ ctx[21].thumb
			? `url(${/*item*/ ctx[21].thumb})`
			: 'none');

			this.first = button;
		},
		m(target, anchor) {
			insert(target, button, anchor);

			if (!mounted) {
				dispose = [
					listen(button, "focus", /*focus_handler*/ ctx[11]),
					listen(button, "click", click_handler)
				];

				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*items*/ 1 && button_title_value !== (button_title_value = /*item*/ ctx[21].caption)) {
				attr(button, "title", button_title_value);
			}

			if (dirty & /*items*/ 1 && button_aria_label_value !== (button_aria_label_value = /*item*/ ctx[21].caption || `View image ${/*item*/ ctx[21].i + 1}`)) {
				attr(button, "aria-label", button_aria_label_value);
			}

			if (dirty & /*items, position*/ 3) {
				toggle_class(button, "active", /*item*/ ctx[21].i === /*position*/ ctx[1]);
			}

			if (dirty & /*items*/ 1) {
				set_style(button, "background-image", /*item*/ ctx[21].thumb
				? `url(${/*item*/ ctx[21].thumb})`
				: 'none');
			}
		},
		d(detaching) {
			if (detaching) {
				detach(button);
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

function create_fragment$5(ctx) {
	let div2;
	let div1;
	let div0;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let style_transform = `translateX(${/*$thumbsTranslate*/ ctx[4]}px)`;
	let div2_intro;
	let div2_outro;
	let current;
	let mounted;
	let dispose;
	let each_value = ensure_array_like(/*items*/ ctx[0]);
	const get_key = ctx => /*item*/ ctx[21].i;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	return {
		c() {
			div2 = element("div");
			div1 = element("div");
			div0 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div0, "class", "bp-thumbs-inner");
			attr(div1, "class", "bp-thumbs-outer");
			set_style(div1, "transform", style_transform);
			attr(div2, "class", "bp-thumbs");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div1);
			append(div1, div0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(div0, null);
				}
			}

			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(/*thumbsActions*/ ctx[10].call(null, div0)),
					listen(div1, "pointerdown", /*pointerDown*/ ctx[7]),
					action_destroyer(/*thumbsActions*/ ctx[10].call(null, div2)),
					listen(div2, "pointermove", /*pointerMove*/ ctx[8]),
					listen(div2, "pointerup", /*pointerUp*/ ctx[9]),
					listen(div2, "pointercancel", /*pointerUp*/ ctx[9])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*items, position, scrollToButton, hasDragged, setPosition*/ 79) {
				each_value = ensure_array_like(/*items*/ ctx[0]);
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div0, destroy_block, create_each_block, null, get_each_context);
			}

			if (dirty & /*$thumbsTranslate*/ 16 && style_transform !== (style_transform = `translateX(${/*$thumbsTranslate*/ ctx[4]}px)`)) {
				set_style(div1, "transform", style_transform);
			}
		},
		i(local) {
			if (current) return;

			add_render_callback(() => {
				if (!current) return;
				if (div2_outro) div2_outro.end(1);
				div2_intro = create_in_transition(div2, fly, defaultTweenOptions(500));
				div2_intro.start();
			});

			current = true;
		},
		o(local) {
			if (div2_intro) div2_intro.invalidate();
			div2_outro = create_out_transition(div2, fly, defaultTweenOptions(500));
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div2);
			}

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			if (detaching && div2_outro) div2_outro.end();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let $thumbsTranslate;
	let { items } = $$props;
	let { position } = $$props;
	let { setPosition } = $$props;
	let thumbsWidth;
	let thumbsPanel;
	let thumbsPanelWidth;
	let initialTranslate = 0;
	let thumbsTranslate = tweened(0, defaultTweenOptions(250));
	component_subscribe($$self, thumbsTranslate, value => $$invalidate(4, $thumbsTranslate = value));
	let isPointerDown, pointerDownX, hasDragged;
	let dragPositions = [];

	const scrollToButton = button => {
		const activeBtn = button || thumbsPanel?.querySelector('.active');

		if (!activeBtn) {
			return;
		}

		let { left, right, width } = activeBtn.getBoundingClientRect();
		let margin = 3;
		let { offsetLeft } = activeBtn;

		if (left + width > thumbsPanelWidth) {
			set_store_value(thumbsTranslate, $thumbsTranslate = boundTranslate(-offsetLeft - width + thumbsPanelWidth - margin), $thumbsTranslate);
		} else if (right - width < 0) {
			set_store_value(thumbsTranslate, $thumbsTranslate = boundTranslate(-offsetLeft + margin), $thumbsTranslate);
		}

		initialTranslate = $thumbsTranslate;
	};

	const boundTranslate = int => {
		if (int >= 0) {
			int = 0;
		} else if (int < thumbsPanelWidth - thumbsWidth - 1) {
			int = thumbsPanelWidth - thumbsWidth - 1;
		}

		return int;
	};

	const pointerDown = e => {
		if (thumbsWidth >= thumbsPanelWidth) {
			isPointerDown = true;
			pointerDownX = e.clientX;
		}
	};

	const pointerMove = e => {
		if (isPointerDown) {
			let dragAmount = -(pointerDownX - e.clientX);

			if (hasDragged) {
				thumbsTranslate.set(boundTranslate(initialTranslate + dragAmount), { duration: 0 });
				dragPositions.push(e.clientX);
			} else {
				$$invalidate(3, hasDragged = Math.abs(dragAmount) > 5);
			}
		}
	};

	const pointerUp = () => {
		if (hasDragged) {
			dragPositions = dragPositions.slice(-3);

			if (dragPositions.length > 1) {
				let xDiff = dragPositions[0] - dragPositions.pop();

				if (Math.abs(xDiff) > 5) {
					set_store_value(thumbsTranslate, $thumbsTranslate = boundTranslate($thumbsTranslate - xDiff * 5), $thumbsTranslate);
				}
			}
		}

		dragPositions = [];
		isPointerDown = $$invalidate(3, hasDragged = false);
		initialTranslate = $thumbsTranslate;
	};

	/**
 * Update dimensions on resize
 */
	const thumbsActions = function (node) {
		thumbsPanel = node;

		const resizeObserver = new ResizeObserver(entries => {
				for (const entry of entries) {
					if (entry.target === thumbsPanel) {
						thumbsPanelWidth = entry.contentRect.width;
					} else {
						thumbsWidth = entry.contentRect.width;
					}
				}
			});

		resizeObserver.observe(node);

		return {
			destroy() {
				resizeObserver.unobserve(node);
			}
		};
	};

	const focus_handler = e => scrollToButton(e.target);
	const click_handler = item => !hasDragged && setPosition(item.i);

	$$self.$$set = $$props => {
		if ('items' in $$props) $$invalidate(0, items = $$props.items);
		if ('position' in $$props) $$invalidate(1, position = $$props.position);
		if ('setPosition' in $$props) $$invalidate(2, setPosition = $$props.setPosition);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*position*/ 2) {
			/**
 * Scroll to an active position on external change
 */
			if (position !== undefined) {
				setTimeout(() => scrollToButton());
			}
		}
	};

	return [
		items,
		position,
		setPosition,
		hasDragged,
		$thumbsTranslate,
		thumbsTranslate,
		scrollToButton,
		pointerDown,
		pointerMove,
		pointerUp,
		thumbsActions,
		focus_handler,
		click_handler
	];
}

class Thumbs extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, not_equal, { items: 0, position: 1, setPosition: 2 });
	}
}

/* src\components\loading.svelte generated by Svelte v4.2.20 */

function create_if_block_1$2(ctx) {
	let div;
	let div_outro;
	let current;

	return {
		c() {
			div = element("div");
			div.innerHTML = `<span class="bp-bar"></span><span class="bp-o"></span>`;
			attr(div, "class", "bp-load");
			set_style(div, "background-image", getThumbBackground(/*activeItem*/ ctx[0]));
		},
		m(target, anchor) {
			insert(target, div, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*activeItem*/ 1) {
				set_style(div, "background-image", getThumbBackground(/*activeItem*/ ctx[0]));
			}
		},
		i(local) {
			if (current) return;
			if (div_outro) div_outro.end(1);
			current = true;
		},
		o(local) {
			if (local) {
				div_outro = create_out_transition(div, fly, defaultTweenOptions(500));
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if (detaching && div_outro) div_outro.end();
		}
	};
}

// (12:67) {#if $closing}
function create_if_block$2(ctx) {
	let div;
	let div_intro;

	return {
		c() {
			div = element("div");
			attr(div, "class", "bp-load");
			set_style(div, "background-image", getThumbBackground(/*activeItem*/ ctx[0]));
		},
		m(target, anchor) {
			insert(target, div, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*activeItem*/ 1) {
				set_style(div, "background-image", getThumbBackground(/*activeItem*/ ctx[0]));
			}
		},
		i(local) {
			if (!div_intro) {
				add_render_callback(() => {
					div_intro = create_in_transition(div, fly, defaultTweenOptions(500));
					div_intro.start();
				});
			}
		},
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function create_fragment$4(ctx) {
	let if_block0_anchor;
	let if_block1_anchor;
	let if_block0 = !/*loaded*/ ctx[1] && create_if_block_1$2(ctx);
	let if_block1 = /*$closing*/ ctx[2] && create_if_block$2(ctx);

	return {
		c() {
			if (if_block0) if_block0.c();
			if_block0_anchor = empty();
			if (if_block1) if_block1.c();
			if_block1_anchor = empty();
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, if_block0_anchor, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, if_block1_anchor, anchor);
		},
		p(ctx, [dirty]) {
			if (!/*loaded*/ ctx[1]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*loaded*/ 2) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_1$2(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(if_block0_anchor.parentNode, if_block0_anchor);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*$closing*/ ctx[2]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty & /*$closing*/ 4) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block$2(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}
		},
		i(local) {
			transition_in(if_block0);
			transition_in(if_block1);
		},
		o(local) {
			transition_out(if_block0);
		},
		d(detaching) {
			if (detaching) {
				detach(if_block0_anchor);
				detach(if_block1_anchor);
			}

			if (if_block0) if_block0.d(detaching);
			if (if_block1) if_block1.d(detaching);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let $closing;
	component_subscribe($$self, closing, $$value => $$invalidate(2, $closing = $$value));
	let { activeItem } = $$props;
	let { loaded } = $$props;

	$$self.$$set = $$props => {
		if ('activeItem' in $$props) $$invalidate(0, activeItem = $$props.activeItem);
		if ('loaded' in $$props) $$invalidate(1, loaded = $$props.loaded);
	};

	return [activeItem, loaded, $closing];
}

class Loading extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$4, not_equal, { activeItem: 0, loaded: 1 });
	}
}

/* src\components\image.svelte generated by Svelte v4.2.20 */

function create_if_block_1$1(ctx) {
	let img;
	let img_sizes_value;
	let mounted;
	let dispose;

	return {
		c() {
			img = element("img");
			attr(img, "sizes", img_sizes_value = /*opts*/ ctx[9].sizes || `${/*sizes*/ ctx[1]}px`);
			attr(img, "alt", /*activeItem*/ ctx[8].alt);
		},
		m(target, anchor) {
			insert(target, img, anchor);

			if (!mounted) {
				dispose = [
					action_destroyer(/*addSrc*/ ctx[21].call(null, img)),
					listen(img, "error", /*error_handler*/ ctx[29])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*sizes*/ 2 && img_sizes_value !== (img_sizes_value = /*opts*/ ctx[9].sizes || `${/*sizes*/ ctx[1]}px`)) {
				attr(img, "sizes", img_sizes_value);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(img);
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

// (351:10) {#if showLoader}
function create_if_block$1(ctx) {
	let loading;
	let current;

	loading = new Loading({
			props: {
				activeItem: /*activeItem*/ ctx[8],
				loaded: /*loaded*/ ctx[2]
			}
		});

	return {
		c() {
			create_component(loading.$$.fragment);
		},
		m(target, anchor) {
			mount_component(loading, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const loading_changes = {};
			if (dirty[0] & /*loaded*/ 4) loading_changes.loaded = /*loaded*/ ctx[2];
			loading.$set(loading_changes);
		},
		i(local) {
			if (current) return;
			transition_in(loading.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(loading.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(loading, detaching);
		}
	};
}

function create_fragment$3(ctx) {
	let div1;
	let div0;
	let if_block0_anchor;
	let style_transform = `translate3d(${/*$imageDimensions*/ ctx[0][0] / -2 + /*$zoomDragTranslate*/ ctx[7][0]}px, ${/*$imageDimensions*/ ctx[0][1] / -2 + /*$zoomDragTranslate*/ ctx[7][1]}px, 0)`;
	let current;
	let mounted;
	let dispose;
	let if_block0 = /*loaded*/ ctx[2] && create_if_block_1$1(ctx);
	let if_block1 = /*showLoader*/ ctx[3] && create_if_block$1(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			if (if_block0) if_block0.c();
			if_block0_anchor = empty();
			if (if_block1) if_block1.c();
			attr(div0, "class", "bp-img");
			set_style(div0, "width", /*$imageDimensions*/ ctx[0][0] + "px");
			set_style(div0, "height", /*$imageDimensions*/ ctx[0][1] + "px");
			toggle_class(div0, "bp-drag", /*pointerDown*/ ctx[4]);
			toggle_class(div0, "bp-canzoom", /*maxZoom*/ ctx[12] > 1 && /*$imageDimensions*/ ctx[0][0] < /*naturalWidth*/ ctx[6]);
			set_style(div0, "background-image", getThumbBackground(/*activeItem*/ ctx[8]));
			set_style(div0, "transform", style_transform);
			attr(div1, "class", "bp-img-wrap");
			toggle_class(div1, "bp-close", /*closingWhileZoomed*/ ctx[5]);
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			if (if_block0) if_block0.m(div0, null);
			append(div0, if_block0_anchor);
			if (if_block1) if_block1.m(div0, null);
			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(/*onMount*/ ctx[20].call(null, div0)),
					listen(div1, "wheel", /*onWheel*/ ctx[15]),
					listen(div1, "pointerdown", /*onPointerDown*/ ctx[16]),
					listen(div1, "pointermove", /*onPointerMove*/ ctx[17]),
					listen(div1, "pointerup", /*onPointerUp*/ ctx[19]),
					listen(div1, "pointercancel", /*removeEventFromCache*/ ctx[18])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (/*loaded*/ ctx[2]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_1$1(ctx);
					if_block0.c();
					if_block0.m(div0, if_block0_anchor);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*showLoader*/ ctx[3]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty[0] & /*showLoader*/ 8) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block$1(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div0, null);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (!current || dirty[0] & /*$imageDimensions*/ 1) {
				set_style(div0, "width", /*$imageDimensions*/ ctx[0][0] + "px");
			}

			if (!current || dirty[0] & /*$imageDimensions*/ 1) {
				set_style(div0, "height", /*$imageDimensions*/ ctx[0][1] + "px");
			}

			if (!current || dirty[0] & /*pointerDown*/ 16) {
				toggle_class(div0, "bp-drag", /*pointerDown*/ ctx[4]);
			}

			if (!current || dirty[0] & /*maxZoom, $imageDimensions, naturalWidth*/ 4161) {
				toggle_class(div0, "bp-canzoom", /*maxZoom*/ ctx[12] > 1 && /*$imageDimensions*/ ctx[0][0] < /*naturalWidth*/ ctx[6]);
			}

			const style_changed = dirty[0] & /*$imageDimensions*/ 1;

			if (dirty[0] & /*$imageDimensions*/ 1 || style_changed) {
				set_style(div0, "background-image", getThumbBackground(/*activeItem*/ ctx[8]));
			}

			if (dirty[0] & /*$imageDimensions, $zoomDragTranslate*/ 129 && style_transform !== (style_transform = `translate3d(${/*$imageDimensions*/ ctx[0][0] / -2 + /*$zoomDragTranslate*/ ctx[7][0]}px, ${/*$imageDimensions*/ ctx[0][1] / -2 + /*$zoomDragTranslate*/ ctx[7][1]}px, 0)`) || style_changed) {
				set_style(div0, "transform", style_transform);
			}

			if (!current || dirty[0] & /*closingWhileZoomed*/ 32) {
				toggle_class(div1, "bp-close", /*closingWhileZoomed*/ ctx[5]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block1);
			current = true;
		},
		o(local) {
			transition_out(if_block1);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let $zoomed;
	let $zoomDragTranslate;
	let $closing;
	let $imageDimensions;
	component_subscribe($$self, closing, $$value => $$invalidate(28, $closing = $$value));
	let { props } = $$props;
	let { smallScreen } = $$props;
	let { containerWidth } = $$props;
	let { containerHeight } = $$props;
	let { activeDimensions } = $$props;
	let { activeItem, opts, prev, next, zoomed, container } = props;
	component_subscribe($$self, zoomed, value => $$invalidate(27, $zoomed = value));
	let maxZoom = activeItem.maxZoom || opts.maxZoom || 10;

	/** value of sizes attribute */
	let sizes = activeDimensions[0];

	/** tracks load state of image */
	let loaded, showLoader;

	/** stores pinch info if multiple touch events active */
	let pinchDetails;

	/** image html element (.bp-img) */
	let bpImg;

	/** track distance for pinch events */
	let prevDiff = 0;

	let pointerDown, hasDragged;
	let dragStartX, dragStartY;

	/** zoomDragTranslate values on start of drag */
	let dragStartTranslateX, dragStartTranslateY;

	/** if true, adds class to .bp-wrap to avoid image cropping */
	let closingWhileZoomed;

	let naturalWidth = +activeItem.width;

	/** store positions for drag inertia */
	const dragPositions = [];

	/** cache pointer events to handle pinch */
	const pointerCache = new Map();

	/** tween to control image size */
	const imageDimensions = tweened(activeDimensions, defaultTweenOptions(500));

	component_subscribe($$self, imageDimensions, value => $$invalidate(0, $imageDimensions = value));

	/** translate transform for pointerDown */
	const zoomDragTranslate = tweened([0, 0], defaultTweenOptions(500));

	component_subscribe($$self, zoomDragTranslate, value => $$invalidate(7, $zoomDragTranslate = value));

	/** calculate translate position with bounds */
	const boundTranslateValues = ([x, y], newDimensions = $imageDimensions) => {
		// image drag translate bounds
		let maxTranslateX = (newDimensions[0] - containerWidth) / 2,
			maxTranslateY = (newDimensions[1] - containerHeight) / 2;

		// x max drag
		if (maxTranslateX < 0) {
			x = 0;
		} else if (x > maxTranslateX) {
			if (smallScreen) {
				// bound to left side (allow slight over drag)
				x = pointerDown
				? maxTranslateX + (x - maxTranslateX) / 10
				: maxTranslateX;

				// previous item if dragged past threshold
				if (x > maxTranslateX + 20) {
					// pointerdown = undefined to stop pointermove from running again
					$$invalidate(4, pointerDown = prev());
				}
			} else {
				x = maxTranslateX;
			}
		} else if (x < -maxTranslateX) {
			// bound to right side (allow slight over drag)
			if (smallScreen) {
				x = pointerDown
				? -maxTranslateX - (-maxTranslateX - x) / 10
				: -maxTranslateX;

				// next item if dragged past threshold
				if (x < -maxTranslateX - 20) {
					// pointerdown = undefined to stop pointermove from running again
					$$invalidate(4, pointerDown = next());
				}
			} else {
				x = -maxTranslateX;
			}
		}

		// y max drag
		if (maxTranslateY < 0) {
			y = 0;
		} else if (y > maxTranslateY) {
			y = maxTranslateY;
		} else if (y < -maxTranslateY) {
			y = -maxTranslateY;
		}

		return [x, y];
	};

	/** updates zoom level in or out based on amt value */
	function changeZoom(amt = maxZoom, e) {
		if ($closing) {
			return;
		}

		let maxWidth = activeDimensions[0] * maxZoom,
			newWidth = $imageDimensions[0] + $imageDimensions[0] * amt,
			newHeight = $imageDimensions[1] + $imageDimensions[1] * amt;

		if (amt > 0) {
			if (newWidth > maxWidth) {
				// requesting size large than max zoom
				newWidth = maxWidth;

				newHeight = activeDimensions[1] * maxZoom;
			}

			if (newWidth > naturalWidth) {
				// if requesting zoom larger than natural size
				newWidth = naturalWidth;

				newHeight = +activeItem.height;
			}
		} else if (newWidth < activeDimensions[0]) {
			// if requesting image smaller than starting size
			imageDimensions.set(activeDimensions);

			return zoomDragTranslate.set([0, 0]);
		}

		let { x, y, width, height } = bpImg.getBoundingClientRect();

		// distance clicked from center of image
		let offsetX = e ? e.clientX - x - width / 2 : 0,
			offsetY = e ? e.clientY - y - height / 2 : 0;

		x = -offsetX * (newWidth / width) + offsetX;
		y = -offsetY * (newHeight / height) + offsetY;
		let newDimensions = [newWidth, newHeight];

		// set new dimensions and update sizes property
		imageDimensions.set(newDimensions).then(() => {
			$$invalidate(1, sizes = Math.round(Math.max(sizes, newWidth)));
		});

		// update translate value
		zoomDragTranslate.set(boundTranslateValues([$zoomDragTranslate[0] + x, $zoomDragTranslate[1] + y], newDimensions));
	}

	// allow zoom to be read / set externally
	Object.defineProperty(activeItem, 'zoom', {
		configurable: true,
		get: () => $zoomed,
		set: bool => changeZoom(bool ? maxZoom : -maxZoom)
	});

	const onWheel = e => {
		// return if scrolling past inline gallery w/ wheel
		if (opts.inline && !$zoomed) {
			return;
		}

		// preventDefault to stop scrolling on zoomed inline image
		e.preventDefault();

		// change zoom on wheel
		changeZoom(e.deltaY / -300, e);
	};

	/** on drag start, store initial position and image translate values */
	const onPointerDown = e => {
		// don't run if right click
		if (e.button !== 2) {
			e.preventDefault();
			$$invalidate(4, pointerDown = true);
			pointerCache.set(e.pointerId, e);
			dragStartX = e.clientX;
			dragStartY = e.clientY;
			dragStartTranslateX = $zoomDragTranslate[0];
			dragStartTranslateY = $zoomDragTranslate[1];
		}
	};

	/** on drag, update image translate val */
	const onPointerMove = e => {
		if (pointerCache.size > 1) {
			// if multiple pointer events, pass to handlePinch function
			$$invalidate(4, pointerDown = false);

			return opts.noPinch?.(container) || handlePinch(e);
		}

		if (!pointerDown) {
			return;
		}

		let x = e.clientX;
		let y = e.clientY;

		// store positions in dragPositions for inertia
		// set hasDragged if > 2 pointer move events
		hasDragged = dragPositions.push({ x, y }) > 2;

		// overall drag diff from start location
		x = x - dragStartX;

		y = y - dragStartY;

		// handle unzoomed left / right / up swipes
		if (!$zoomed) {
			// close if swipe up
			if (y < -90) {
				$$invalidate(4, pointerDown = !opts.noClose && props.close());
			}

			// only handle left / right if not swiping vertically
			if (Math.abs(y) < 30) {
				// previous if swipe left
				if (x > 40) {
					// pointerdown = undefined to stop pointermove from running again
					$$invalidate(4, pointerDown = prev());
				}

				// next if swipe right
				if (x < -40) {
					// pointerdown = undefined to stop pointermove from running again
					$$invalidate(4, pointerDown = next());
				}
			}
		}

		// image drag when zoomed
		if ($zoomed && hasDragged && !$closing) {
			zoomDragTranslate.set(boundTranslateValues([dragStartTranslateX + x, dragStartTranslateY + y]), { duration: 0 });
		}
	};

	const handlePinch = e => {
		// update event in cache and get values
		const [p1, p2] = pointerCache.set(e.pointerId, e).values();

		// Calculate the distance between the two pointers
		const dx = p1.clientX - p2.clientX;

		const dy = p1.clientY - p2.clientY;
		const curDiff = Math.hypot(dx, dy);

		// cache the original pinch center
		pinchDetails = pinchDetails || {
			clientX: (p1.clientX + p2.clientX) / 2,
			clientY: (p1.clientY + p2.clientY) / 2
		};

		// scale image
		changeZoom(((prevDiff || curDiff) - curDiff) / -35, pinchDetails);

		// Cache the distance for the next move event
		prevDiff = curDiff;
	};

	/** remove event from pointer event cache */
	const removeEventFromCache = e => pointerCache.delete(e.pointerId);

	const onPointerUp = function (e) {
		removeEventFromCache(e);

		if (pinchDetails) {
			// reset prevDiff and clear pointerDown to trigger return below
			$$invalidate(4, pointerDown = prevDiff = 0);

			// set pinchDetails to null after last finger lifts
			pinchDetails = pointerCache.size ? pinchDetails : null;
		}

		// make sure pointer events don't carry over to next image
		if (!pointerDown) {
			return;
		}

		$$invalidate(4, pointerDown = false);

		// close if overlay is clicked
		if (e.target === this && !opts.noClose) {
			return props.close();
		}

		// add drag inertia / snap back to bounds
		if (hasDragged) {
			const [posOne, posTwo, posThree] = dragPositions.slice(-3);
			const xDiff = posTwo.x - posThree.x;
			const yDiff = posTwo.y - posThree.y;

			if (Math.hypot(xDiff, yDiff) > 5) {
				zoomDragTranslate.set(boundTranslateValues([
					$zoomDragTranslate[0] - (posOne.x - posThree.x) * 5,
					$zoomDragTranslate[1] - (posOne.y - posThree.y) * 5
				]));
			}
		} else if (!opts.onImageClick?.(container, activeItem)) {
			changeZoom($zoomed ? -maxZoom : maxZoom, e);
		}

		// reset pointer states
		hasDragged = false;

		// reset dragPositions
		dragPositions.length = 0;
	};

	const onMount = node => {
		bpImg = node;

		// decode initial image before rendering
		props.loadImage(activeItem).then(() => {
			$$invalidate(6, naturalWidth = +activeItem.width);
			$$invalidate(2, loaded = true);
			props.preloadNext();
		});

		// show loading indicator if needed
		setTimeout(
			() => {
				$$invalidate(3, showLoader = !loaded);
			},
			250
		);
	};

	const addSrc = node => {
		addAttributes(node, activeItem.attr);
	};

	const error_handler = error => opts.onError?.(container, activeItem, error);

	$$self.$$set = $$props => {
		
		if ('smallScreen' in $$props) $$invalidate(23, smallScreen = $$props.smallScreen);
		if ('containerWidth' in $$props) $$invalidate(24, containerWidth = $$props.containerWidth);
		if ('containerHeight' in $$props) $$invalidate(25, containerHeight = $$props.containerHeight);
		if ('activeDimensions' in $$props) $$invalidate(26, activeDimensions = $$props.activeDimensions);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*$imageDimensions, activeDimensions*/ 67108865) {
			zoomed.set($imageDimensions[0] - 10 > activeDimensions[0]);
		}

		if ($$self.$$.dirty[0] & /*$closing, $zoomed, activeDimensions*/ 469762048) {
			// if zoomed while closing, zoom out image and add class
			// to change contain value on .bp-wrap to avoid cropping
			if ($closing && $zoomed && !opts.intro) {
				const closeTweenOpts = defaultTweenOptions(500);
				zoomDragTranslate.set([0, 0], closeTweenOpts);
				imageDimensions.set(activeDimensions, closeTweenOpts);
				$$invalidate(5, closingWhileZoomed = true);
			}
		}

		if ($$self.$$.dirty[0] & /*activeDimensions, smallScreen*/ 75497472) {
			if (activeDimensions && (opts.inline || !smallScreen)) {
				imageDimensions.set(activeDimensions);
				zoomDragTranslate.set([0, 0]);
			}
		}
	};

	return [
		$imageDimensions,
		sizes,
		loaded,
		showLoader,
		pointerDown,
		closingWhileZoomed,
		naturalWidth,
		$zoomDragTranslate,
		activeItem,
		opts,
		zoomed,
		container,
		maxZoom,
		imageDimensions,
		zoomDragTranslate,
		onWheel,
		onPointerDown,
		onPointerMove,
		removeEventFromCache,
		onPointerUp,
		onMount,
		addSrc,
		props,
		smallScreen,
		containerWidth,
		containerHeight,
		activeDimensions,
		$zoomed,
		$closing,
		error_handler
	];
}

let Image$1 = class Image extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$3,
			create_fragment$3,
			not_equal,
			{
				props: 22,
				smallScreen: 23,
				containerWidth: 24,
				containerHeight: 25,
				activeDimensions: 26
			},
			null,
			[-1, -1]
		);
	}
};

/* src\components\iframe.svelte generated by Svelte v4.2.20 */

function create_fragment$2(ctx) {
	let div;
	let iframe;
	let loading;
	let style_width = `${/*activeDimensions*/ ctx[0][0]}px`;
	let style_height = `${/*activeDimensions*/ ctx[0][1]}px`;
	let current;
	let mounted;
	let dispose;

	loading = new Loading({
			props: {
				activeItem: /*activeItem*/ ctx[2],
				loaded: /*loaded*/ ctx[1]
			}
		});

	return {
		c() {
			div = element("div");
			iframe = element("iframe");
			create_component(loading.$$.fragment);
			attr(iframe, "allow", "autoplay; fullscreen");
			attr(iframe, "title", /*activeItem*/ ctx[2].title);
			attr(div, "class", "bp-iframe");
			set_style(div, "width", style_width);
			set_style(div, "height", style_height);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, iframe);
			mount_component(loading, div, null);
			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(/*addSrc*/ ctx[3].call(null, iframe)),
					listen(iframe, "load", /*load_handler*/ ctx[5])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			const loading_changes = {};
			if (dirty & /*loaded*/ 2) loading_changes.loaded = /*loaded*/ ctx[1];
			loading.$set(loading_changes);

			if (dirty & /*activeDimensions*/ 1 && style_width !== (style_width = `${/*activeDimensions*/ ctx[0][0]}px`)) {
				set_style(div, "width", style_width);
			}

			if (dirty & /*activeDimensions*/ 1 && style_height !== (style_height = `${/*activeDimensions*/ ctx[0][1]}px`)) {
				set_style(div, "height", style_height);
			}
		},
		i(local) {
			if (current) return;
			transition_in(loading.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(loading.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(loading);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { props } = $$props;
	let { activeDimensions } = $$props;
	let loaded = false;
	const { activeItem } = props;

	const addSrc = node => {
		addAttributes(node, activeItem.attr);
		node.src = activeItem.iframe;
	};

	const load_handler = () => $$invalidate(1, loaded = true);

	$$self.$$set = $$props => {
		
		if ('activeDimensions' in $$props) $$invalidate(0, activeDimensions = $$props.activeDimensions);
	};

	return [activeDimensions, loaded, activeItem, addSrc, props, load_handler];
}

class Iframe extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, not_equal, { props: 4, activeDimensions: 0 });
	}
}

/* src\components\video.svelte generated by Svelte v4.2.20 */

function create_fragment$1(ctx) {
	let div;
	let loading;
	let style_width = `${/*activeDimensions*/ ctx[0][0]}px`;
	let style_height = `${/*activeDimensions*/ ctx[0][1]}px`;
	let current;
	let mounted;
	let dispose;

	loading = new Loading({
			props: {
				activeItem: /*activeItem*/ ctx[2],
				loaded: /*loaded*/ ctx[1]
			}
		});

	return {
		c() {
			div = element("div");
			create_component(loading.$$.fragment);
			attr(div, "class", "bp-video");
			set_style(div, "width", style_width);
			set_style(div, "height", style_height);
			set_style(div, "background-image", getThumbBackground(/*activeItem*/ ctx[2]));
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(loading, div, null);
			current = true;

			if (!mounted) {
				dispose = action_destroyer(/*onMount*/ ctx[3].call(null, div));
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			const loading_changes = {};
			if (dirty & /*loaded*/ 2) loading_changes.loaded = /*loaded*/ ctx[1];
			loading.$set(loading_changes);

			if (dirty & /*activeDimensions*/ 1 && style_width !== (style_width = `${/*activeDimensions*/ ctx[0][0]}px`)) {
				set_style(div, "width", style_width);
			}

			if (dirty & /*activeDimensions*/ 1 && style_height !== (style_height = `${/*activeDimensions*/ ctx[0][1]}px`)) {
				set_style(div, "height", style_height);
			}
		},
		i(local) {
			if (current) return;
			transition_in(loading.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(loading.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			destroy_component(loading);
			mounted = false;
			dispose();
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { props } = $$props;
	let { activeDimensions } = $$props;
	let loaded = false;
	const { activeItem, opts, container } = props;

	/** create audio / video element */
	const onMount = node => {
		let mediaElement;

		/** takes supplied object and creates elements in video */
		const appendToVideo = (tag, list) => {
			if (!Array.isArray(list)) {
				list = JSON.parse(list);
			}

			for (let item of list) {
				// create media element if it doesn't exist
				if (!mediaElement) {
					mediaElement = document.createElement((item.type?.includes('audio')) ? 'audio' : 'video');

					addAttributes(mediaElement, {
						controls: true,
						autoplay: true,
						playsinline: true,
						tabindex: '0'
					});

					addAttributes(mediaElement, activeItem.attr);
				}

				// add sources / tracks to media element
				let el = document.createElement(tag);

				addAttributes(el, item);

				if (tag === 'source') {
					el.onError = error => opts.onError?.(container, activeItem, error);
				}

				mediaElement.append(el);
			}
		};

		appendToVideo('source', activeItem.sources);

		if (activeItem.tracks) {
			appendToVideo('track', activeItem.tracks);
		}

		mediaElement.oncanplay = () => $$invalidate(1, loaded = true);
		node.append(mediaElement);
	};

	$$self.$$set = $$props => {
		
		if ('activeDimensions' in $$props) $$invalidate(0, activeDimensions = $$props.activeDimensions);
	};

	return [activeDimensions, loaded, activeItem, onMount, props];
}

class Video extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, not_equal, { props: 4, activeDimensions: 0 });
	}
}

/* src\bigger-picture.svelte generated by Svelte v4.2.20 */

function create_if_block(ctx) {
	let div5;
	let div0;
	let div0_intro;
	let div0_outro;
	let div3;
	let div2;
	let previous_key = /*activeItem*/ ctx[8].i;
	let div1;
	let div4;
	let button;
	let div4_intro;
	let div4_outro;
	let current;
	let mounted;
	let dispose;
	let key_block = create_key_block(ctx);
	let if_block0 = /*activeItem*/ ctx[8].caption && create_if_block_3(ctx);
	let if_block1 = /*items*/ ctx[0].length > 1 && create_if_block_2(ctx);
	let if_block2 = /*opts*/ ctx[6].thumbs && /*items*/ ctx[0].length > 1 && create_if_block_1(ctx);

	return {
		c() {
			div5 = element("div");
			div0 = element("div");
			div3 = element("div");
			div2 = element("div");
			key_block.c();
			div1 = element("div");
			if (if_block0) if_block0.c();
			div4 = element("div");
			button = element("button");
			if (if_block1) if_block1.c();
			if (if_block2) if_block2.c();
			attr(div0, "class", "bp-overlay");
			attr(div1, "class", "bp-ruler");
			attr(div2, "class", "bp-inner");
			attr(div3, "class", "bp-stage");
			attr(button, "class", "bp-x");
			attr(button, "title", "Close");
			attr(button, "aria-label", "Close");
			attr(div4, "class", "bp-controls");
			attr(div5, "class", "bp-wrap");
			toggle_class(div5, "bp-zoomed", /*$zoomed*/ ctx[14]);
			toggle_class(div5, "bp-inline", /*inline*/ ctx[10]);
			toggle_class(div5, "bp-small", /*smallScreen*/ ctx[9]);
			toggle_class(div5, "bp-noclose", /*opts*/ ctx[6].noClose);
		},
		m(target, anchor) {
			insert(target, div5, anchor);
			append(div5, div0);
			append(div5, div3);
			append(div3, div2);
			key_block.m(div2, null);
			append(div2, div1);
			if (if_block0) if_block0.m(div3, null);
			append(div5, div4);
			append(div4, button);
			if (if_block1) if_block1.m(div4, null);
			if (if_block2) if_block2.m(div5, null);
			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(/*rulerActions*/ ctx[19].call(null, div1)),
					listen(button, "click", /*close*/ ctx[1]),
					action_destroyer(/*containerActions*/ ctx[18].call(null, div5))
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*activeItem*/ 256 && not_equal(previous_key, previous_key = /*activeItem*/ ctx[8].i)) {
				group_outros();
				transition_out(key_block, 1, 1, noop);
				check_outros();
				key_block = create_key_block(ctx);
				key_block.c();
				transition_in(key_block, 1);
				key_block.m(div2, div1);
			} else {
				key_block.p(ctx, dirty);
			}

			if (/*activeItem*/ ctx[8].caption) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty[0] & /*activeItem*/ 256) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_3(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div3, null);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*items*/ ctx[0].length > 1) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_2(ctx);
					if_block1.c();
					if_block1.m(div4, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (/*opts*/ ctx[6].thumbs && /*items*/ ctx[0].length > 1) {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty[0] & /*opts, items*/ 65) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block_1(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(div5, null);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}

			if (!current || dirty[0] & /*$zoomed*/ 16384) {
				toggle_class(div5, "bp-zoomed", /*$zoomed*/ ctx[14]);
			}

			if (!current || dirty[0] & /*inline*/ 1024) {
				toggle_class(div5, "bp-inline", /*inline*/ ctx[10]);
			}

			if (!current || dirty[0] & /*smallScreen*/ 512) {
				toggle_class(div5, "bp-small", /*smallScreen*/ ctx[9]);
			}

			if (!current || dirty[0] & /*opts*/ 64) {
				toggle_class(div5, "bp-noclose", /*opts*/ ctx[6].noClose);
			}
		},
		i(local) {
			if (current) return;

			add_render_callback(() => {
				if (!current) return;
				if (div0_outro) div0_outro.end(1);
				div0_intro = create_in_transition(div0, fly, defaultTweenOptions(500));
				div0_intro.start();
			});

			transition_in(key_block);
			transition_in(if_block0);

			add_render_callback(() => {
				if (!current) return;
				if (div4_outro) div4_outro.end(1);
				div4_intro = create_in_transition(div4, fly, defaultTweenOptions(500));
				div4_intro.start();
			});

			transition_in(if_block2);
			current = true;
		},
		o(local) {
			if (div0_intro) div0_intro.invalidate();
			div0_outro = create_out_transition(div0, fly, defaultTweenOptions(500));
			transition_out(key_block);
			transition_out(if_block0);
			if (div4_intro) div4_intro.invalidate();
			div4_outro = create_out_transition(div4, fly, defaultTweenOptions(500));
			transition_out(if_block2);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div5);
			}

			if (detaching && div0_outro) div0_outro.end();
			key_block.d(detaching);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (detaching && div4_outro) div4_outro.end();
			if (if_block2) if_block2.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

// (756:6) {#if containerWidth > 0 && containerHeight > 0}
function create_if_block_4(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block_5, create_if_block_6, create_if_block_7, create_else_block];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*activeItem*/ ctx[8].img) return 0;
		if (/*activeItem*/ ctx[8].sources) return 1;
		if (/*activeItem*/ ctx[8].iframe) return 2;
		return 3;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if_blocks[current_block_type_index].d(detaching);
		}
	};
}

// (756:340) {:else}
function create_else_block(ctx) {
	let div;
	let raw_value = (/*activeItem*/ ctx[8].html ?? /*activeItem*/ ctx[8].element.outerHTML) + "";

	return {
		c() {
			div = element("div");
			attr(div, "class", "bp-html");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			div.innerHTML = raw_value;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*activeItem*/ 256 && raw_value !== (raw_value = (/*activeItem*/ ctx[8].html ?? /*activeItem*/ ctx[8].element.outerHTML) + "")) div.innerHTML = raw_value;		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

// (756:287) 
function create_if_block_7(ctx) {
	let iframe;
	let current;

	iframe = new Iframe({
			props: {
				props: /*getChildProps*/ ctx[17](),
				activeDimensions: /*activeDimensions*/ ctx[13]
			}
		});

	return {
		c() {
			create_component(iframe.$$.fragment);
		},
		m(target, anchor) {
			mount_component(iframe, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const iframe_changes = {};
			if (dirty[0] & /*activeDimensions*/ 8192) iframe_changes.activeDimensions = /*activeDimensions*/ ctx[13];
			iframe.$set(iframe_changes);
		},
		i(local) {
			if (current) return;
			transition_in(iframe.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(iframe.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(iframe, detaching);
		}
	};
}

// (756:207) 
function create_if_block_6(ctx) {
	let video;
	let current;

	video = new Video({
			props: {
				props: /*getChildProps*/ ctx[17](),
				activeDimensions: /*activeDimensions*/ ctx[13]
			}
		});

	return {
		c() {
			create_component(video.$$.fragment);
		},
		m(target, anchor) {
			mount_component(video, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const video_changes = {};
			if (dirty[0] & /*activeDimensions*/ 8192) video_changes.activeDimensions = /*activeDimensions*/ ctx[13];
			video.$set(video_changes);
		},
		i(local) {
			if (current) return;
			transition_in(video.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(video.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(video, detaching);
		}
	};
}

// (756:53) {#if activeItem.img}
function create_if_block_5(ctx) {
	let imageitem;
	let current;

	imageitem = new Image$1({
			props: {
				props: /*getChildProps*/ ctx[17](),
				smallScreen: /*smallScreen*/ ctx[9],
				containerWidth: /*containerWidth*/ ctx[7],
				containerHeight: /*containerHeight*/ ctx[12],
				activeDimensions: /*activeDimensions*/ ctx[13]
			}
		});

	return {
		c() {
			create_component(imageitem.$$.fragment);
		},
		m(target, anchor) {
			mount_component(imageitem, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const imageitem_changes = {};
			if (dirty[0] & /*smallScreen*/ 512) imageitem_changes.smallScreen = /*smallScreen*/ ctx[9];
			if (dirty[0] & /*containerWidth*/ 128) imageitem_changes.containerWidth = /*containerWidth*/ ctx[7];
			if (dirty[0] & /*containerHeight*/ 4096) imageitem_changes.containerHeight = /*containerHeight*/ ctx[12];
			if (dirty[0] & /*activeDimensions*/ 8192) imageitem_changes.activeDimensions = /*activeDimensions*/ ctx[13];
			imageitem.$set(imageitem_changes);
		},
		i(local) {
			if (current) return;
			transition_in(imageitem.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(imageitem.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(imageitem, detaching);
		}
	};
}

// (745:159) {#key activeItem.i}
function create_key_block(ctx) {
	let div;
	let div_intro;
	let div_outro;
	let current;
	let mounted;
	let dispose;
	let if_block = /*containerWidth*/ ctx[7] > 0 && /*containerHeight*/ ctx[12] > 0 && create_if_block_4(ctx);

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "class", "bp-slide");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(div, "pointerdown", /*pointerdown_handler*/ ctx[24]),
					listen(div, "pointerup", /*pointerup_handler*/ ctx[25])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (/*containerWidth*/ ctx[7] > 0 && /*containerHeight*/ ctx[12] > 0) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty[0] & /*containerWidth, containerHeight*/ 4224) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_4(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);

			add_render_callback(() => {
				if (!current) return;
				if (div_outro) div_outro.end(1);
				div_intro = create_in_transition(div, /*mediaTransition*/ ctx[16], true);
				div_intro.start();
			});

			current = true;
		},
		o(local) {
			transition_out(if_block);
			if (div_intro) div_intro.invalidate();
			div_outro = create_out_transition(div, /*mediaTransition*/ ctx[16], false);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if (if_block) if_block.d();
			if (detaching && div_outro) div_outro.end();
			mounted = false;
			run_all(dispose);
		}
	};
}

// (756:502) {#if activeItem.caption}
function create_if_block_3(ctx) {
	let div;
	let raw_value = /*activeItem*/ ctx[8].caption + "";
	let div_intro;
	let div_outro;
	let current;

	return {
		c() {
			div = element("div");
			attr(div, "class", "bp-caption");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			div.innerHTML = raw_value;
			current = true;
		},
		p(ctx, dirty) {
			if ((!current || dirty[0] & /*activeItem*/ 256) && raw_value !== (raw_value = /*activeItem*/ ctx[8].caption + "")) div.innerHTML = raw_value;		},
		i(local) {
			if (current) return;

			add_render_callback(() => {
				if (!current) return;
				if (div_outro) div_outro.end(1);
				div_intro = create_in_transition(div, fly, defaultTweenOptions(500));
				div_intro.start();
			});

			current = true;
		},
		o(local) {
			if (div_intro) div_intro.invalidate();
			div_outro = create_out_transition(div, fly, defaultTweenOptions(500));
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}

			if (detaching && div_outro) div_outro.end();
		}
	};
}

// (756:885) {#if items.length > 1}
function create_if_block_2(ctx) {
	let div;
	let raw_value = `${/*position*/ ctx[5] + 1} / ${/*items*/ ctx[0].length}` + "";
	let button0;
	let button1;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			button0 = element("button");
			button1 = element("button");
			attr(div, "class", "bp-count");
			attr(button0, "class", "bp-prev");
			attr(button0, "title", "Previous");
			attr(button0, "aria-label", "Previous");
			attr(button1, "class", "bp-next");
			attr(button1, "title", "Next");
			attr(button1, "aria-label", "Next");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			div.innerHTML = raw_value;
			insert(target, button0, anchor);
			insert(target, button1, anchor);

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*prev*/ ctx[2]),
					listen(button1, "click", /*next*/ ctx[3])
				];

				mounted = true;
			}
		},
		p(ctx, dirty) {
			if (dirty[0] & /*position, items*/ 33 && raw_value !== (raw_value = `${/*position*/ ctx[5] + 1} / ${/*items*/ ctx[0].length}` + "")) div.innerHTML = raw_value;		},
		d(detaching) {
			if (detaching) {
				detach(div);
				detach(button0);
				detach(button1);
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

// (766:25) {#if opts.thumbs && items.length > 1}
function create_if_block_1(ctx) {
	let thumbs;
	let current;

	thumbs = new Thumbs({
			props: {
				position: /*position*/ ctx[5],
				setPosition: /*setPosition*/ ctx[4],
				items: /*items*/ ctx[0]
			}
		});

	return {
		c() {
			create_component(thumbs.$$.fragment);
		},
		m(target, anchor) {
			mount_component(thumbs, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const thumbs_changes = {};
			if (dirty[0] & /*position*/ 32) thumbs_changes.position = /*position*/ ctx[5];
			if (dirty[0] & /*items*/ 1) thumbs_changes.items = /*items*/ ctx[0];
			thumbs.$set(thumbs_changes);
		},
		i(local) {
			if (current) return;
			transition_in(thumbs.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(thumbs.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(thumbs, detaching);
		}
	};
}

function create_fragment(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*items*/ ctx[0] && create_if_block(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (/*items*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty[0] & /*items*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if (if_block) if_block.d(detaching);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let $zoomed;
	let { items = undefined } = $$props;
	let { target = undefined } = $$props;
	const html = document.documentElement;

	/** index of current active item */
	let position = 0;

	/** options passed via open method */
	let opts;

	/** bool tracks open state */
	let isOpen;

	/** dom element to restore focus to on close */
	let focusTrigger;

	/** bool true if container width < 769 */
	let smallScreen;

	/** bool value of inline option passed in open method */
	let inline;

	/** when position is set */
	let movement;

	/** stores target on pointerdown (ref for overlay close) */
	let clickedEl;

	let ruler;
	let container;
	let containerWidth;
	let containerHeight;

	/** active item object */
	let activeItem = null;

	let activeDimensions;

	// /** true if image is currently zoomed past starting size */
	const zoomed = writable(0);

	component_subscribe($$self, zoomed, value => $$invalidate(14, $zoomed = value));

	const open = options => {
		$$invalidate(6, opts = options);
		$$invalidate(10, inline = opts.inline);

		/**
 * Lock the scroll unless gallery is inline
 */
		if (!inline && html.scrollHeight > html.clientHeight) {
			html.classList.add('bp-lock');
		}

		/**
 * Update trigger element to restore focus
 */
		focusTrigger = document.activeElement;

		if (target) {
			$$invalidate(23, container = target);
			$$invalidate(7, containerWidth = target.offsetWidth);

			$$invalidate(12, containerHeight = target === document.body
			? window.innerHeight
			: target.clientHeight);
		}

		$$invalidate(5, position = opts.position || 0);

		/**
 * Set the gallery items
 */
		const list = [];

		if (opts.items instanceof HTMLElement) {
			$$invalidate(6, opts.items = [opts.items], opts);
		} else {
			$$invalidate(6, opts.items = Array.from(opts.items), opts);
		}

		opts.items.forEach((item, i) => {
			item = prepareItem(item);

			if (typeof item !== 'object') {
				return;
			}

			item.i = i;

			if (opts.el && opts.el === item.element) {
				$$invalidate(5, position = i);
			}

			list.push(item);
		});

		$$invalidate(0, items = list);
	};

	const close = () => {
		opts.onClose?.(container, activeItem);
		closing.set(true);
		$$invalidate(0, items = null);
		focusTrigger?.focus({ preventScroll: true });
	};

	const prev = () => setPosition(position - 1);
	const next = () => setPosition(position + 1);

	const setPosition = index => {
		movement = index - position;
		$$invalidate(5, position = getNextPosition(index));
	};

	/**
 * Get the next gallery position
 *
 * @param {number} index
 */
	const getNextPosition = index => (index + items.length) % items.length;

	/**
 * Handle the keyboard events
 *
 * @param e
 *
 * @returns {Object|false}
 */
	const onKeydown = e => {
		const { key, shiftKey } = e;

		if (key === 'Escape') {
			!opts.noClose && close();
		} else if (key === 'ArrowRight') {
			next();
		} else if (key === 'ArrowLeft') {
			prev();
		} else if (key === 'Tab') {
			/**
 * Trap the focus on tab press
 */
			const { activeElement } = document;

			/**
 * Allow browser to handle tab into video controls only
 */
			if (shiftKey || !activeElement.controls) {
				e.preventDefault();
				const { focusWrap = container } = opts;
				const tabbable = [...focusWrap.querySelectorAll('*')].filter(node => node.tabIndex >= 0);
				let index = tabbable.indexOf(activeElement);
				index += tabbable.length + (shiftKey ? -1 : 1);
				tabbable[index % tabbable.length].focus();
			}
		}
	};

	/**
 * Normalize a gallery item
 *
 * @param {Object} item
 */
	const prepareItem = item => {
		if (item instanceof HTMLElement) {
			item = { element: item, ...item.dataset };
		}

		item.attr = item.attr || {};

		[
			'link',
			'thumb',
			'iframe',
			'html',
			'img',
			'sources',
			'caption',
			'alt',
			'fit',
			'attr'
		].forEach(key => {
			if (typeof item[key] === 'function') {
				item[key] = item[key](item);
			}
		});

		if (item.sources && typeof item.sources === 'string') {
			item.sources = JSON.parse(item.sources);
		}

		if (item.sources) {
			item.type = 'video';
		} else if (item.iframe) {
			item.type = 'iframe';
		} else if (item.img) {
			item.type = 'image';
		} else if (item.html) {
			item.type = 'html';
		} else {
			let link = item.element?.link || item.element?.href || '';

			if (link) {
				item = parseLink(link, item);
			} else {
				return false;
			}
		}

		if (opts.types && opts.types.indexOf(item.type) === -1) {
			return false;
		} else {
			return parseThumbnail(item);
		}
	};

	/**
 * Parse the link and detect the content type
 *
 * @param {string} link
 * @param {Object} item
 *
 * @returns {Object}
 */
	const parseLink = (link, item) => {
		let match = link.match(/\.(?:jpe?g|png|gif|bmp|webp|avif|svg|tiff|ico)(?:[\?#].*)?$/i);

		if (match) {
			item.type = 'image';
			item.img = link;
			return item;
		}

		/**
 * HTML5 Video
 */
		match = link.match(/\.(mp4|mpeg|mov|ogv|webm|avi|h264)((\?|#).*)?$/i);

		if (match) {
			item.type = 'video';
			let ext = match[1].toLowerCase();

			let mimeMap = {
				ogv: 'ogg',
				mov: 'quicktime',
				avi: 'x-msvideo'
			};

			item.sources = [
				{
					'src': link,
					'type': 'video/' + (mimeMap[ext] || ext)
				}
			];

			return item;
		}

		/**
 * HTML5 Audio
 */
		match = link.match(/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|wma|weba|mid)((\?|#).*)?$/i);

		if (match) {
			let ext = match[1].toLowerCase();

			let mimeMap = {
				mp3: 'mpeg',
				m4a: 'mp4',
				oga: 'ogg',
				opus: 'ogg',
				mid: 'midi',
				weba: 'webm'
			};

			item.type = 'video';

			item.sources = [
				{
					src: link,
					type: 'audio/' + (mimeMap[ext] || ext)
				}
			];
		}

		/**
 * YouTube Video
 */
		match = link.match(/(youtube\.com|youtu\.be)\/(?:watch\?(?:.*&)?v=|v\/|u\/|shorts\/|embed\/?)?(videoseries\?list=(?:.*)|[\w-]{11}|\?listType=(?:.*)&list=(?:.*))(?:.*)/i);

		if (match) {
			let videoID = encodeURIComponent(match[2]),
				sourceURL = new URL(link),
				targetURL = new URL('https://www.youtube.com/embed/' + videoID + '?autoplay=1&playsinline=1&controls=1&rel=0');

			sourceURL.searchParams.delete('v');

			for (let [key, value] of sourceURL.searchParams) {
				if (key === 't') {
					let timeMatch = value.match(/((\d*)m)?(\d*)s?/);

					if (timeMatch) {
						key = 'start';
						value = 60 * parseInt(timeMatch[2] || '0') + parseInt(timeMatch[3] || '0');
					}
				}

				targetURL.searchParams.set(key, value);
			}

			item.type = 'iframe';
			item.iframe = targetURL.toString();
			item.preview = 'https://i.ytimg.com/vi/' + videoID + '/mqdefault.jpg';
			return item;
		}

		/**
 * Vimeo Video
 */
		match = link.match(/^.+vimeo.com\/(?:\/)?(video\/)?([\d]+)((\/|\?h=)([a-z0-9]+))?(.*)?/);

		if (match) {
			let videoID = encodeURIComponent(match[2]),
				sourceURL = new URL(link),
				targetURL = new URL('https://player.vimeo.com/video/' + videoID + '?autoplay=1&playsinline=1');

			for (let [key, value] of sourceURL.searchParams) {
				targetURL.searchParams.set(key, value);
			}

			if (match[5]) {
				targetURL.searchParams.set('h', match[5]);
			} else {
				item.preview = 'https://vumbnail.com/' + videoID + '.jpg';
			}

			if (sourceURL.hash && sourceURL.hash.startsWith('#t=')) {
				targetURL.hash = sourceURL.hash;
			}

			item.type = 'iframe';
			item.iframe = targetURL.toString();
			return item;
		}

		/**
 * SoundCloud Widget
 */
		match = link.match(/^(https?:\/\/)?(www\.)?(m\.)?soundcloud\.com\/([a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+.*)$/);

		if (match) {
			let targetURL = new URL('https://w.soundcloud.com/player/?auto_play=1&visual=1&hide_related=1&show_comments=0');
			targetURL.searchParams.set('url', link);
			item.type = 'iframe';
			item.iframe = targetURL.toString();
			return item;
		}

		/**
 * Google Drive, Dropbox, and PDF files
 */
		match = link.match(/(drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+))|(dropbox\.com\/s\/)|(\.pdf($|\?|#))/i);

		if (match) {
			if (match[1] && match[2]) {
				// Google Drive
				item.iframe = `https://drive.google.com/file/d/${match[2]}/preview`;
			} else if (match[3]) {
				// Dropbox
				const url = new URL(link);

				url.searchParams.set('raw', '1');
				url.searchParams.delete('dl');
				item.iframe = url.toString();
			} else if (match[4]) {
				// PDF Files
				item.iframe = link;
			}

			if (!item.width || !item.height) {
				item.width = containerWidth;
				item.height = containerHeight;
			}
		}

		return item;
	};

	/**
 * Parse a thumbnail, update dimensions, and the fit option
 *
 * @param {Object} item
 */
	const parseThumbnail = item => {
		let thumbElement = false;

		if (item.thumb instanceof HTMLImageElement) {
			thumbElement = item.thumb;
		} else if (item.element) {
			thumbElement = item.element.querySelector('img');
		}

		if (thumbElement) {
			if (!item.fit) {
				item.fit = window.getComputedStyle(thumbElement).objectFit;
			}

			if (!item.thumb || item.thumb === thumbElement.src) {
				item.thumb = thumbElement.src;
				setDimensions(item, thumbElement);
			}

			return item;
		}

		let thumbLink = item.thumb || item.preview;

		if (thumbLink) {
			thumbElement = new Image();
			thumbElement.src = thumbLink;

			thumbElement.onload = () => {
				setDimensions(item, thumbElement);
			};
		}

		return item;
	};

	/**
 * Set item dimensions based on a thumbnail image if not already specified
 *
 * @param {Object} item Gallery item object to check and update
 * @param {HTMLImageElement} thumb Thumbnail image element to extract dimensions from
 */
	const setDimensions = (item, thumb) => {
		if (thumb instanceof HTMLImageElement && (!item.width || !item.height)) {
			let dimensions = calculateDimensions({
				width: thumb.naturalWidth,
				height: thumb.naturalHeight
			});

			item.width = dimensions[0];
			item.height = dimensions[1];
			item.scaled = 1;
			$$invalidate(13, activeDimensions = dimensions);
		}
	};

	/**
 * Calculate width and height to fit inside a container
 *
 * @param {object} item object with height / width properties
 * @returns {Array} [width: number, height: number]
 */
	const calculateDimensions = ({ width = 1920, height = 1080 }) => {
		const activeGap = container
		? parseInt(window.getComputedStyle(container).getPropertyValue('--bp-stage-gap'))
		: 0;

		const { scale = 1 } = opts;
		const ratio = Math.min((containerWidth - 2 * activeGap) / width * scale, (containerHeight - 2 * activeGap) / height * scale);

		// round number so we don't use a float as the sizes attribute
		return [Math.round(width * ratio), Math.round(height * ratio)];
	};

	/** preloads images for previous and next items in gallery */
	const preloadNext = () => {
		if (items) {
			const nextItem = items[getNextPosition(position + 1)];
			const prevItem = items[getNextPosition(position - 1)];
			!nextItem.preload && loadImage(nextItem);
			!prevItem.preload && loadImage(prevItem);
		}
	};

	/**
 * Load and decode the image for an item
 *
 * @param {Object} item
 */
	const loadImage = item => {
		if (item.img) {
			let image = document.createElement('img'),
				src = decodeURIComponent(item.img),
				srcset = '';

			if ((/\s+\d+[wx]/).test(src)) {
				let match = '',
					parts = Array.from(src.matchAll(/(\S+)\s+(\d+)([wx])/gi), match => ({
						url: match[1],
						value: parseInt(match[2]),
						type: match[3]
					}));

				srcset = src;

				if (parts.length > 1) {
					if (parts[0].type === 'w') {
						parts.sort((a, b) => a.value - b.value);
						match = parts.find(c => c.value >= containerWidth) || parts[parts.length - 1];
					} else {
						let dpr = window.devicePixelRatio || 1;
						match = parts.find(c => c.value >= dpr) || parts[parts.length - 1];
					}
				}

				if (!match && parts[0]) {
					match = parts[0];
				}

				if (match && match.url) {
					image.src = match.url;
					item.attr.src = match.url;
				} else {
					image.srcset = srcset;
				}

				image.sizes = opts.sizes || `${calculateDimensions(item)[0]}px`;
				item.attr.sizes = image.sizes;
				item.attr.srcset = srcset;
			} else {
				image.src = src;
				item.attr.src = src;
			}

			image.preload = true;

			return image.decode().then(() => {
				if (item.scaled && image.naturalWidth > 0 && image.naturalHeight > 0) {
					item.width = image.naturalWidth;
					item.height = image.naturalHeight;
				}

				/**
 * It's important to set srcset after we read the image dimensions
 */
				if (image.src && srcset) {
					image.srcset = srcset;
				}
			}).catch(error => {
				
			});
		}
	};

	/** svelte transition to control opening / changing */
	const mediaTransition = (node, isEntering) => {
		if (!isOpen || !items) {
			// entrance / exit transition
			$$invalidate(22, isOpen = isEntering);

			return opts.intro
			? fly(node, { y: isEntering ? 10 : -10 })
			: scaleIn(node);
		}

		// forward / backward transition
		return fly(node, {
			...defaultTweenOptions(250),
			x: (movement > 0 ? 20 : -20) * (isEntering ? 1 : -1)
		});
	};

	/** custom svelte transition for entrance zoom */
	const scaleIn = node => {
		let dimensions;
		let css;

		/**
 * Update the container dimensions before triggering an animation
 */
		if (ruler) {
			$$invalidate(7, containerWidth = ruler.clientWidth);
			$$invalidate(12, containerHeight = ruler.clientHeight);
		}

		if (!activeItem.img && !activeItem.sources && !activeItem.iframe) {
			const bpItem = node.firstChild.firstChild;
			dimensions = [bpItem.clientWidth, bpItem.clientHeight];
		} else {
			dimensions = activeDimensions;
		}

		// rect is bounding rect of trigger element
		const rect = (activeItem.element || focusTrigger).getBoundingClientRect();

		const leftOffset = rect.left - (containerWidth - rect.width) / 2;
		const centerTop = rect.top - (containerHeight - rect.height) / 2;
		const scaleWidth = rect.width / dimensions[0];
		const scaleHeight = rect.height / dimensions[1];

		if (activeItem.fit === 'cover') {
			const scale = Math.max(scaleHeight, scaleWidth),
				offsetVertical = Math.max((dimensions[1] - rect.height / scale) / 2, 0),
				offsetHorizontal = Math.max((dimensions[0] - rect.width / scale) / 2, 0);

			css = (t, u) => {
				return `transform: translate3d(${leftOffset * u}px, ${centerTop * u}px, 0) scale3d(${scale + t * (1 - scale)}, ${scale + t * (1 - scale)}, 1);
				--bp-clip-y: ${offsetVertical * u}px;
				--bp-clip-x: ${offsetHorizontal * u}px;`;
			};
		} else if (activeItem.fit === 'contain') {
			const scale = Math.min(scaleHeight, scaleWidth);

			css = (t, u) => {
				return `transform: translate3d(${leftOffset * u}px, ${centerTop * u}px, 0) scale3d(${scale + t * (1 - scale)}, ${scale + t * (1 - scale)}, 1);`;
			};
		} else {
			css = (t, u) => {
				return `transform: translate3d(${leftOffset * u}px, ${centerTop * u}px, 0) scale3d(${scaleWidth + t * (1 - scaleWidth)}, ${scaleHeight + t * (1 - scaleHeight)}, 1);`;
			};
		}

		return { ...defaultTweenOptions(500), css };
	};

	/** provides object w/ needed funcs / data to child components  */
	const getChildProps = () => ({
		calculateDimensions,
		preloadNext,
		activeItem,
		loadImage,
		container,
		zoomed,
		close,
		opts,
		prev,
		next
	});

	/**
 * Process the gallery mount and destroy
 */
	const containerActions = node => {
		$$invalidate(23, container = node);
		opts.onOpen?.(container, activeItem);

		// don't use keyboard events for inline galleries
		if (!inline) {
			window.addEventListener('keydown', onKeydown);
		}

		return {
			destroy() {
				window.removeEventListener('keydown', onKeydown);
				closing.set(false);

				// remove class hiding scroll
				html.classList.remove('bp-lock');

				opts.onClosed?.();
			}
		};
	};

	/**
 * Ruler is required to get accurate dimensions and handle container resize
 */
	const rulerActions = node => {
		ruler = node;

		const rulerObserver = new ResizeObserver(entries => {
				const rect = entries[0].contentRect;

				if (rect.width !== containerWidth || rect.height !== containerHeight) {
					$$invalidate(7, containerWidth = rect.width);
					$$invalidate(12, containerHeight = rect.height);
					$$invalidate(13, activeDimensions = calculateDimensions(activeItem));
				}

				/**
 * Run the user-defined resize function
 */
				opts.onResize?.(container, activeItem);
			});

		rulerObserver.observe(node);

		return {
			destroy() {
				rulerObserver.disconnect();
			}
		};
	};

	const pointerdown_handler = e => $$invalidate(11, clickedEl = e.target);

	const pointerup_handler = function (e) {
		// only close if left click on self and not dragged
		if (e.button !== 2 && e.target === this && clickedEl === this) {
			!opts.noClose && close();
		}
	};

	$$self.$$set = $$props => {
		if ('items' in $$props) $$invalidate(0, items = $$props.items);
		if ('target' in $$props) $$invalidate(20, target = $$props.target);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*items, position, activeItem, isOpen, opts, container*/ 12583265) {
			/**
 * Update the active item and dimensions on position change
 */
			if (items && items[position]) {
				$$invalidate(8, activeItem = items[position]);
				$$invalidate(13, activeDimensions = calculateDimensions(activeItem));

				if (isOpen) {
					opts.onUpdate?.(container, activeItem);
				}
			}
		}

		if ($$self.$$.dirty[0] & /*containerWidth*/ 128) {
			$$invalidate(9, smallScreen = containerWidth < 769);
		}
	};

	return [
		items,
		close,
		prev,
		next,
		setPosition,
		position,
		opts,
		containerWidth,
		activeItem,
		smallScreen,
		inline,
		clickedEl,
		containerHeight,
		activeDimensions,
		$zoomed,
		zoomed,
		mediaTransition,
		getChildProps,
		containerActions,
		rulerActions,
		target,
		open,
		isOpen,
		container,
		pointerdown_handler,
		pointerup_handler
	];
}

class Bigger_picture extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance,
			create_fragment,
			not_equal,
			{
				items: 0,
				target: 20,
				open: 21,
				close: 1,
				prev: 2,
				next: 3,
				setPosition: 4
			},
			null,
			[-1, -1]
		);
	}

	get items() {
		return this.$$.ctx[0];
	}



	get target() {
		return this.$$.ctx[20];
	}



	get open() {
		return this.$$.ctx[21];
	}

	get close() {
		return this.$$.ctx[1];
	}

	get prev() {
		return this.$$.ctx[2];
	}

	get next() {
		return this.$$.ctx[3];
	}

	get setPosition() {
		return this.$$.ctx[4];
	}
}

/**
 * Initializes BiggerPicture and assigns provided options to a props property
 *
 * @param {{target: HTMLElement}} options
 * @returns BiggerPicture instance
 */
function biggerPicture (options) {
	if (typeof options !== 'object') {
		options = {
			target: document.body
		};
	}
	return new Bigger_picture({
		...options,
		props: options,
	})
}

export { biggerPicture as default };
