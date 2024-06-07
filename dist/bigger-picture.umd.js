(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.BiggerPicture = factory());
})(this, (function () {
    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function run(fn) {
        return fn();
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function not_equal(a, b) {
        return a != a ? b == b : a !== b;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    let now = () => globalThis.performance.now()
        ;
    let raf = cb => requestAnimationFrame(cb) ;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value);
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }
    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    // function hash(str) {
    //     let hash = 5381;
    //     let i = str.length;
    //     while (i--)
    //         hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    //     return hash >>> 0;
    // }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `_bp_${Math.round(Math.random() * 1e9)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('_bp') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
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
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
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
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
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
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
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
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
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
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
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
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
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

    /** true if gallery is in the process of closing */
    const closing = writable(0);

    /** store if user prefers reduced motion  */
    const prefersReducedMotion = globalThis.matchMedia?.(
    	'(prefers-reduced-motion: reduce)'
    ).matches;

    /** default options for tweens / transitions */
    const defaultTweenOptions = (duration) => ({
    	easing: cubicOut,
    	duration: prefersReducedMotion ? 0 : duration,
    });

    const getThumbBackground = (activeItem) =>
    	!activeItem.thumb || `url(${activeItem.thumb})`;

    /**
     * Adds attributes to the given node based on the provided object.
     *
     * @param {HTMLElement} node - The node to which attributes will be added
     * @param {Record<string, string | boolean> | string} obj - The object containing key-value pairs of attributes to be added
     */
    const addAttributes = (node, obj) => {
    	if (!obj) {
    		return
    	}
    	if (typeof obj === 'string') {
    		obj = JSON.parse(obj);
    	}
    	for (const key in obj) {
    		node.setAttribute(key, obj[key]);
    	}
    };

    /* src/components/loading.svelte generated by Svelte v3.55.1 */

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
    				div_outro = create_out_transition(div, fly, { duration: 480 });
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};
    }

    // (11:57) {#if $closing}
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
    					div_intro = create_in_transition(div, fly, { duration: 480 });
    					div_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
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
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach(if_block0_anchor);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach(if_block1_anchor);
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

    /* src/components/image.svelte generated by Svelte v3.55.1 */

    function create_if_block_1$1(ctx) {
    	let img;
    	let img_sizes_value;
    	let img_outro;
    	let current;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			img = element("img");
    			attr(img, "sizes", img_sizes_value = /*opts*/ ctx[8].sizes || `${/*sizes*/ ctx[1]}px`);
    			attr(img, "alt", /*activeItem*/ ctx[7].alt);
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(/*addSrc*/ ctx[21].call(null, img)),
    					listen(img, "error", /*error_handler*/ ctx[27])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*sizes*/ 2 && img_sizes_value !== (img_sizes_value = /*opts*/ ctx[8].sizes || `${/*sizes*/ ctx[1]}px`)) {
    				attr(img, "sizes", img_sizes_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (img_outro) img_outro.end(1);
    			current = true;
    		},
    		o(local) {
    			img_outro = create_out_transition(img, fly, {});
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    			if (detaching && img_outro) img_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (384:10) {#if showLoader}
    function create_if_block$1(ctx) {
    	let loading;
    	let current;

    	loading = new Loading({
    			props: {
    				activeItem: /*activeItem*/ ctx[7],
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
    	let style_transform = `translate3d(${/*$imageDimensions*/ ctx[0][0] / -2 + /*$zoomDragTranslate*/ ctx[6][0]}px, ${/*$imageDimensions*/ ctx[0][1] / -2 + /*$zoomDragTranslate*/ ctx[6][1]}px, 0)`;
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
    			toggle_class(div0, "bp-canzoom", /*maxZoom*/ ctx[11] > 1 && /*$imageDimensions*/ ctx[0][0] < /*naturalWidth*/ ctx[12]);
    			set_style(div0, "background-image", getThumbBackground(/*activeItem*/ ctx[7]));
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

    					if (dirty[0] & /*loaded*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, if_block0_anchor);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
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

    			if (!current || dirty[0] & /*maxZoom, $imageDimensions, naturalWidth*/ 6145) {
    				toggle_class(div0, "bp-canzoom", /*maxZoom*/ ctx[11] > 1 && /*$imageDimensions*/ ctx[0][0] < /*naturalWidth*/ ctx[12]);
    			}

    			if (dirty[0] & /*$imageDimensions, $zoomDragTranslate*/ 65 && style_transform !== (style_transform = `translate3d(${/*$imageDimensions*/ ctx[0][0] / -2 + /*$zoomDragTranslate*/ ctx[6][0]}px, ${/*$imageDimensions*/ ctx[0][1] / -2 + /*$zoomDragTranslate*/ ctx[6][1]}px, 0)`)) {
    				set_style(div0, "transform", style_transform);
    			}

    			if (!current || dirty[0] & /*closingWhileZoomed*/ 32) {
    				toggle_class(div1, "bp-close", /*closingWhileZoomed*/ ctx[5]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
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
    	component_subscribe($$self, closing, $$value => $$invalidate(26, $closing = $$value));
    	let { props } = $$props;
    	let { smallScreen } = $$props;
    	let { activeItem, opts, prev, next, zoomed, container } = props;
    	component_subscribe($$self, zoomed, value => $$invalidate(25, $zoomed = value));
    	let maxZoom = activeItem.maxZoom || opts.maxZoom || 10;
    	let calculatedDimensions = props.calculateDimensions(activeItem);

    	/** value of sizes attribute */
    	let sizes = calculatedDimensions[0];

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

    	const naturalWidth = +activeItem.width;

    	/** store positions for drag inertia */
    	const dragPositions = [];

    	/** cache pointer events to handle pinch */
    	const pointerCache = new Map();

    	/** tween to control image size */
    	const imageDimensions = tweened(calculatedDimensions, defaultTweenOptions(400));

    	component_subscribe($$self, imageDimensions, value => $$invalidate(0, $imageDimensions = value));

    	/** translate transform for pointerDown */
    	const zoomDragTranslate = tweened([0, 0], defaultTweenOptions(400));

    	component_subscribe($$self, zoomDragTranslate, value => $$invalidate(6, $zoomDragTranslate = value));

    	/** calculate translate position with bounds */
    	const boundTranslateValues = ([x, y], newDimensions = $imageDimensions) => {
    		// image drag translate bounds
    		const maxTranslateX = (newDimensions[0] - container.w) / 2;

    		const maxTranslateY = (newDimensions[1] - container.h) / 2;

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

    		const maxWidth = calculatedDimensions[0] * maxZoom;
    		let newWidth = $imageDimensions[0] + $imageDimensions[0] * amt;
    		let newHeight = $imageDimensions[1] + $imageDimensions[1] * amt;

    		if (amt > 0) {
    			if (newWidth > maxWidth) {
    				// requesting size large than max zoom
    				newWidth = maxWidth;

    				newHeight = calculatedDimensions[1] * maxZoom;
    			}

    			if (newWidth > naturalWidth) {
    				// if requesting zoom larger than natural size
    				newWidth = naturalWidth;

    				newHeight = +activeItem.height;
    			}
    		} else if (newWidth < calculatedDimensions[0]) {
    			// if requesting image smaller than starting size
    			imageDimensions.set(calculatedDimensions);

    			return zoomDragTranslate.set([0, 0]);
    		}

    		let { x, y, width, height } = bpImg.getBoundingClientRect();

    		// distance clicked from center of image
    		const offsetX = e ? e.clientX - x - width / 2 : 0;

    		const offsetY = e ? e.clientY - y - height / 2 : 0;
    		x = -offsetX * (newWidth / width) + offsetX;
    		y = -offsetY * (newHeight / height) + offsetY;
    		const newDimensions = [newWidth, newHeight];

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

    			return opts.noPinch?.(container.el) || handlePinch(e);
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

    	function onPointerUp(e) {
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
    		} else if (!opts.onImageClick?.(container.el, activeItem)) {
    			changeZoom($zoomed ? -maxZoom : maxZoom, e);
    		}

    		// reset pointer states
    		hasDragged = false;

    		// reset dragPositions
    		dragPositions.length = 0;
    	}

    	const onMount = node => {
    		bpImg = node;

    		// handle globalThis resize
    		props.setResizeFunc(() => {
    			$$invalidate(24, calculatedDimensions = props.calculateDimensions(activeItem));

    			// adjust image size / zoom on resize, but not on mobile because
    			// some browsers (ios safari 15) constantly resize screen on drag
    			if (opts.inline || !smallScreen) {
    				imageDimensions.set(calculatedDimensions);
    				zoomDragTranslate.set([0, 0]);
    			}
    		});

    		// decode initial image before rendering
    		props.loadImage(activeItem).then(() => {
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
    		node.srcset = activeItem.img;
    	};

    	const error_handler = error => opts.onError?.(container, activeItem, error);

    	$$self.$$set = $$props => {
    		
    		if ('smallScreen' in $$props) $$invalidate(23, smallScreen = $$props.smallScreen);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$imageDimensions, calculatedDimensions*/ 16777217) {
    			zoomed.set($imageDimensions[0] - 10 > calculatedDimensions[0]);
    		}

    		if ($$self.$$.dirty[0] & /*$closing, $zoomed, calculatedDimensions*/ 117440512) {
    			// if zoomed while closing, zoom out image and add class
    			// to change contain value on .bp-wrap to avoid cropping
    			if ($closing && $zoomed && !opts.intro) {
    				const closeTweenOpts = defaultTweenOptions(480);
    				zoomDragTranslate.set([0, 0], closeTweenOpts);
    				imageDimensions.set(calculatedDimensions, closeTweenOpts);
    				$$invalidate(5, closingWhileZoomed = true);
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
    		$zoomDragTranslate,
    		activeItem,
    		opts,
    		zoomed,
    		container,
    		maxZoom,
    		naturalWidth,
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
    		calculatedDimensions,
    		$zoomed,
    		$closing,
    		error_handler
    	];
    }

    class Image extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, not_equal, { props: 22, smallScreen: 23 }, null, [-1, -1]);
    	}
    }

    /* src/components/iframe.svelte generated by Svelte v3.55.1 */

    function create_fragment$2(ctx) {
    	let div;
    	let iframe;
    	let loading;
    	let current;
    	let mounted;
    	let dispose;

    	loading = new Loading({
    			props: {
    				activeItem: /*activeItem*/ ctx[2],
    				loaded: /*loaded*/ ctx[0]
    			}
    		});

    	return {
    		c() {
    			div = element("div");
    			iframe = element("iframe");
    			create_component(loading.$$.fragment);
    			attr(iframe, "allow", "autoplay; fullscreen");
    			attr(iframe, "title", /*activeItem*/ ctx[2].title);
    			attr(div, "class", "bp-if");
    			set_style(div, "width", /*dimensions*/ ctx[1][0] + "px");
    			set_style(div, "height", /*dimensions*/ ctx[1][1] + "px");
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
    			if (dirty & /*loaded*/ 1) loading_changes.loaded = /*loaded*/ ctx[0];
    			loading.$set(loading_changes);

    			if (!current || dirty & /*dimensions*/ 2) {
    				set_style(div, "width", /*dimensions*/ ctx[1][0] + "px");
    			}

    			if (!current || dirty & /*dimensions*/ 2) {
    				set_style(div, "height", /*dimensions*/ ctx[1][1] + "px");
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
    			if (detaching) detach(div);
    			destroy_component(loading);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { props } = $$props;
    	let loaded, dimensions;
    	const { activeItem } = props;
    	const setDimensions = () => $$invalidate(1, dimensions = props.calculateDimensions(activeItem));
    	setDimensions();
    	props.setResizeFunc(setDimensions);

    	const addSrc = node => {
    		addAttributes(node, activeItem.attr);
    		node.src = activeItem.iframe;
    	};

    	const load_handler = () => $$invalidate(0, loaded = true);

    	

    	return [loaded, dimensions, activeItem, addSrc, props, load_handler];
    }

    class Iframe extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, not_equal, { props: 4 });
    	}
    }

    /* src/components/video.svelte generated by Svelte v3.55.1 */

    function create_fragment$1(ctx) {
    	let div;
    	let loading;
    	let current;
    	let mounted;
    	let dispose;

    	loading = new Loading({
    			props: {
    				activeItem: /*activeItem*/ ctx[2],
    				loaded: /*loaded*/ ctx[0]
    			}
    		});

    	return {
    		c() {
    			div = element("div");
    			create_component(loading.$$.fragment);
    			attr(div, "class", "bp-vid");
    			set_style(div, "width", /*dimensions*/ ctx[1][0] + "px");
    			set_style(div, "height", /*dimensions*/ ctx[1][1] + "px");
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
    			if (dirty & /*loaded*/ 1) loading_changes.loaded = /*loaded*/ ctx[0];
    			loading.$set(loading_changes);

    			if (!current || dirty & /*dimensions*/ 2) {
    				set_style(div, "width", /*dimensions*/ ctx[1][0] + "px");
    			}

    			if (!current || dirty & /*dimensions*/ 2) {
    				set_style(div, "height", /*dimensions*/ ctx[1][1] + "px");
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
    			if (detaching) detach(div);
    			destroy_component(loading);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { props } = $$props;
    	let loaded, dimensions;
    	const { activeItem, opts, container } = props;
    	const setDimensions = () => $$invalidate(1, dimensions = props.calculateDimensions(activeItem));
    	setDimensions();
    	props.setResizeFunc(setDimensions);

    	/** create audo / video element */
    	const onMount = node => {
    		let mediaElement;

    		/** takes supplied object and creates elements in video */
    		const appendToVideo = (tag, arr) => {
    			if (!Array.isArray(arr)) {
    				arr = JSON.parse(arr);
    			}

    			for (const obj of arr) {
    				// create media element if it doesn't exist
    				if (!mediaElement) {
    					mediaElement = document.createElement((obj.type?.includes('audio')) ? 'audio' : 'video');

    					addAttributes(mediaElement, {
    						controls: true,
    						autoplay: true,
    						playsinline: true,
    						tabindex: '0'
    					});

    					addAttributes(mediaElement, activeItem.attr);
    				}

    				// add sources / tracks to media element
    				const el = document.createElement(tag);

    				addAttributes(el, obj);

    				if (tag == 'source') {
    					el.onError = error => opts.onError?.(container, activeItem, error);
    				}

    				mediaElement.append(el);
    			}
    		};

    		appendToVideo('source', activeItem.sources);
    		appendToVideo('track', activeItem.tracks || []);
    		mediaElement.oncanplay = () => $$invalidate(0, loaded = true);
    		node.append(mediaElement);
    	};

    	

    	return [loaded, dimensions, activeItem, onMount, props];
    }

    class Video extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, not_equal, { props: 4 });
    	}
    }

    /* src/bigger-picture.svelte generated by Svelte v3.55.1 */

    function create_if_block(ctx) {
    	let div2;
    	let div0;
    	let div0_outro;
    	let previous_key = /*activeItem*/ ctx[6].i;
    	let div1;
    	let button;
    	let div1_outro;
    	let current;
    	let mounted;
    	let dispose;
    	let key_block = create_key_block(ctx);
    	let if_block = /*items*/ ctx[0].length > 1 && create_if_block_1(ctx);

    	return {
    		c() {
    			div2 = element("div");
    			div0 = element("div");
    			key_block.c();
    			div1 = element("div");
    			button = element("button");
    			if (if_block) if_block.c();
    			attr(button, "class", "bp-x");
    			attr(button, "title", "Close");
    			attr(button, "aria-label", "Close");
    			attr(div1, "class", "bp-controls");
    			attr(div2, "class", "bp-wrap");
    			toggle_class(div2, "bp-zoomed", /*$zoomed*/ ctx[10]);
    			toggle_class(div2, "bp-inline", /*inline*/ ctx[8]);
    			toggle_class(div2, "bp-small", /*smallScreen*/ ctx[7]);
    			toggle_class(div2, "bp-noclose", /*opts*/ ctx[5].noClose);
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			key_block.m(div2, null);
    			append(div2, div1);
    			append(div1, button);
    			if (if_block) if_block.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button, "click", /*close*/ ctx[1]),
    					action_destroyer(/*containerActions*/ ctx[14].call(null, div2))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*activeItem*/ 64 && not_equal(previous_key, previous_key = /*activeItem*/ ctx[6].i)) {
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

    			if (/*items*/ ctx[0].length > 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty[0] & /*$zoomed*/ 1024) {
    				toggle_class(div2, "bp-zoomed", /*$zoomed*/ ctx[10]);
    			}

    			if (!current || dirty[0] & /*inline*/ 256) {
    				toggle_class(div2, "bp-inline", /*inline*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*smallScreen*/ 128) {
    				toggle_class(div2, "bp-small", /*smallScreen*/ ctx[7]);
    			}

    			if (!current || dirty[0] & /*opts*/ 32) {
    				toggle_class(div2, "bp-noclose", /*opts*/ ctx[5].noClose);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (div0_outro) div0_outro.end(1);
    			transition_in(key_block);
    			if (div1_outro) div1_outro.end(1);
    			current = true;
    		},
    		o(local) {
    			if (local) {
    				div0_outro = create_out_transition(div0, fly, { duration: 480 });
    			}

    			transition_out(key_block);

    			if (local) {
    				div1_outro = create_out_transition(div1, fly, {});
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			if (detaching && div0_outro) div0_outro.end();
    			key_block.d(detaching);
    			if (if_block) if_block.d();
    			if (detaching && div1_outro) div1_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (311:199) {:else}
    function create_else_block(ctx) {
    	let div;
    	let raw_value = (/*activeItem*/ ctx[6].html ?? /*activeItem*/ ctx[6].element.outerHTML) + "";

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
    			if (dirty[0] & /*activeItem*/ 64 && raw_value !== (raw_value = (/*activeItem*/ ctx[6].html ?? /*activeItem*/ ctx[6].element.outerHTML) + "")) div.innerHTML = raw_value;		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (311:165) 
    function create_if_block_5(ctx) {
    	let iframe;
    	let current;

    	iframe = new Iframe({
    			props: { props: /*getChildProps*/ ctx[13]() }
    		});

    	return {
    		c() {
    			create_component(iframe.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(iframe, target, anchor);
    			current = true;
    		},
    		p: noop,
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

    // (311:104) 
    function create_if_block_4(ctx) {
    	let video;
    	let current;

    	video = new Video({
    			props: { props: /*getChildProps*/ ctx[13]() }
    		});

    	return {
    		c() {
    			create_component(video.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(video, target, anchor);
    			current = true;
    		},
    		p: noop,
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

    // (311:4) {#if activeItem.img}
    function create_if_block_3(ctx) {
    	let imageitem;
    	let current;

    	imageitem = new Image({
    			props: {
    				props: /*getChildProps*/ ctx[13](),
    				smallScreen: /*smallScreen*/ ctx[7]
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
    			if (dirty[0] & /*smallScreen*/ 128) imageitem_changes.smallScreen = /*smallScreen*/ ctx[7];
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

    // (311:299) {#if activeItem.caption}
    function create_if_block_2(ctx) {
    	let div;
    	let raw_value = /*activeItem*/ ctx[6].caption + "";
    	let div_outro;
    	let current;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "bp-cap");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			div.innerHTML = raw_value;
    			current = true;
    		},
    		p(ctx, dirty) {
    			if ((!current || dirty[0] & /*activeItem*/ 64) && raw_value !== (raw_value = /*activeItem*/ ctx[6].caption + "")) div.innerHTML = raw_value;		},
    		i(local) {
    			if (current) return;
    			if (div_outro) div_outro.end(1);
    			current = true;
    		},
    		o(local) {
    			div_outro = create_out_transition(div, fly, { duration: 200 });
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};
    }

    // (300:43) {#key activeItem.i}
    function create_key_block(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block0;
    	let div_intro;
    	let div_outro;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_3, create_if_block_4, create_if_block_5, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*activeItem*/ ctx[6].img) return 0;
    		if (/*activeItem*/ ctx[6].sources) return 1;
    		if (/*activeItem*/ ctx[6].iframe) return 2;
    		return 3;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*activeItem*/ ctx[6].caption && create_if_block_2(ctx);

    	return {
    		c() {
    			div = element("div");
    			if_block0.c();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr(div, "class", "bp-inner");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div, "pointerdown", /*pointerdown_handler*/ ctx[20]),
    					listen(div, "pointerup", /*pointerup_handler*/ ctx[21])
    				];

    				mounted = true;
    			}
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
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div, null);
    			}

    			if (/*activeItem*/ ctx[6].caption) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*activeItem*/ 64) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				div_intro = create_in_transition(div, /*mediaTransition*/ ctx[12], true);
    				div_intro.start();
    			});

    			transition_in(if_block1);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, /*mediaTransition*/ ctx[12], false);
    			transition_out(if_block1);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if_blocks[current_block_type_index].d();
    			if (detaching && div_outro) div_outro.end();
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach(if_block1_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (311:554) {#if items.length > 1}
    function create_if_block_1(ctx) {
    	let div;
    	let raw_value = `${/*position*/ ctx[4] + 1} / ${/*items*/ ctx[0].length}` + "";
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
    			if (dirty[0] & /*position, items*/ 17 && raw_value !== (raw_value = `${/*position*/ ctx[4] + 1} / ${/*items*/ ctx[0].length}` + "")) div.innerHTML = raw_value;		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (detaching) detach(button0);
    			if (detaching) detach(button1);
    			mounted = false;
    			run_all(dispose);
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $zoomed;
    	let { items = undefined } = $$props;
    	let { target = undefined } = $$props;
    	const html = document.documentElement;

    	/** index of current active item */
    	let position;

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

    	/** active item object */
    	let activeItem;

    	/** returns true if `activeItem` is html */
    	const activeItemIsHtml = () => !activeItem.img && !activeItem.sources && !activeItem.iframe;

    	/** function set by child component to run when container resized */
    	let resizeFunc;

    	/** used by child components to set resize function */
    	const setResizeFunc = fn => resizeFunc = fn;

    	/** container element (el) / width (w) / height (h) */
    	const container = {};

    	// /** true if image is currently zoomed past starting size */
    	const zoomed = writable(0);

    	component_subscribe($$self, zoomed, value => $$invalidate(10, $zoomed = value));

    	const open = options => {
    		$$invalidate(5, opts = options);
    		$$invalidate(8, inline = opts.inline);

    		// add class to hide scroll if not inline gallery
    		if (!inline && html.scrollHeight > html.clientHeight) {
    			html.classList.add('bp-lock');
    		}

    		// update trigger element to restore focus
    		focusTrigger = document.activeElement;

    		$$invalidate(19, container.w = target.offsetWidth, container);

    		$$invalidate(
    			19,
    			container.h = target === document.body
    			? globalThis.innerHeight
    			: target.clientHeight,
    			container
    		);

    		$$invalidate(7, smallScreen = container.w < 769);
    		$$invalidate(4, position = opts.position || 0);

    		// set items
    		$$invalidate(0, items = []);

    		for (let i = 0; i < (opts.items.length || 1); i++) {
    			let item = opts.items[i] || opts.items;

    			if ('dataset' in item) {
    				items.push({ element: item, i, ...item.dataset });
    			} else {
    				item.i = i;
    				items.push(item);

    				// set item to element for position check below
    				item = item.element;
    			}

    			// override gallery position if needed
    			if (opts.el && opts.el === item) {
    				$$invalidate(4, position = i);
    			}
    		}
    	};

    	const close = () => {
    		opts.onClose?.(container.el, activeItem);
    		closing.set(true);
    		$$invalidate(0, items = null);

    		// restore focus to trigger element
    		focusTrigger?.focus({ preventScroll: true });
    	};

    	const prev = () => setPosition(position - 1);
    	const next = () => setPosition(position + 1);

    	const setPosition = index => {
    		movement = index - position;
    		$$invalidate(4, position = getNextPosition(index));
    	};

    	/**
     * returns next gallery position (looped if neccessary)
     * @param {number} index
     */
    	const getNextPosition = index => (index + items.length) % items.length;

    	const onKeydown = e => {
    		const { key, shiftKey } = e;

    		if (key === 'Escape') {
    			!opts.noClose && close();
    		} else if (key === 'ArrowRight') {
    			next();
    		} else if (key === 'ArrowLeft') {
    			prev();
    		} else if (key === 'Tab') {
    			// trap focus on tab press
    			const { activeElement } = document;

    			// allow browser to handle tab into video controls only
    			if (shiftKey || !activeElement.controls) {
    				e.preventDefault();
    				const { focusWrap = container.el } = opts;
    				const tabbable = [...focusWrap.querySelectorAll('*')].filter(node => node.tabIndex >= 0);
    				let index = tabbable.indexOf(activeElement);
    				index += tabbable.length + (shiftKey ? -1 : 1);
    				tabbable[index % tabbable.length].focus();
    			}
    		}
    	};

    	/**
     * calculate dimensions of height / width resized to fit within container
     * @param {object} item object with height / width properties
     * @returns {Array} [width: number, height: number]
     */
    	const calculateDimensions = ({ width = 1920, height = 1080 }) => {
    		const { scale = 0.99 } = opts;
    		const ratio = Math.min(1, container.w / width * scale, container.h / height * scale);

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

    	/** loads / decodes image for item */
    	const loadImage = item => {
    		if (item.img) {
    			const image = document.createElement('img');
    			image.sizes = opts.sizes || `${calculateDimensions(item)[0]}px`;
    			image.srcset = item.img;
    			item.preload = true;

    			return image.decode().catch(error => {
    				
    			});
    		}
    	};

    	/** svelte transition to control opening / changing */
    	const mediaTransition = (node, isEntering) => {
    		if (!isOpen || !items) {
    			// entrance / exit transition
    			$$invalidate(18, isOpen = isEntering);

    			return opts.intro
    			? fly(node, { y: isEntering ? 10 : -10 })
    			: scaleIn(node);
    		}

    		// forward / backward transition
    		return fly(node, {
    			x: (movement > 0 ? 20 : -20) * (isEntering ? 1 : -1),
    			duration: 250
    		});
    	};

    	/** custom svelte transition for entrance zoom */
    	const scaleIn = node => {
    		let dimensions;

    		if (activeItemIsHtml()) {
    			const bpItem = node.firstChild.firstChild;
    			dimensions = [bpItem.clientWidth, bpItem.clientHeight];
    		} else {
    			dimensions = calculateDimensions(activeItem);
    		}

    		// rect is bounding rect of trigger element
    		const rect = (activeItem.element || focusTrigger).getBoundingClientRect();

    		const leftOffset = rect.left - (container.w - rect.width) / 2;
    		const centerTop = rect.top - (container.h - rect.height) / 2;
    		const scaleWidth = rect.width / dimensions[0];
    		const scaleHeight = rect.height / dimensions[1];

    		return {
    			duration: 480,
    			easing: cubicOut,
    			css: (t, u) => {
    				return `transform:translate3d(${leftOffset * u}px, ${centerTop * u}px, 0) scale3d(${scaleWidth + t * (1 - scaleWidth)}, ${scaleHeight + t * (1 - scaleHeight)}, 1)`;
    			}
    		};
    	};

    	/** provides object w/ needed funcs / data to child components  */
    	const getChildProps = () => ({
    		activeItem,
    		calculateDimensions,
    		loadImage,
    		preloadNext,
    		opts,
    		prev,
    		next,
    		close,
    		setResizeFunc,
    		zoomed,
    		container
    	});

    	/** code to run on mount / destroy */
    	const containerActions = node => {
    		$$invalidate(19, container.el = node, container);
    		let roActive;
    		opts.onOpen?.(container.el, activeItem);

    		// don't use keyboard events for inline galleries
    		if (!inline) {
    			globalThis.addEventListener('keydown', onKeydown);
    		}

    		// set up resize observer
    		const ro = new ResizeObserver(entries => {
    				// use roActive to avoid running on initial open
    				if (roActive) {
    					$$invalidate(19, container.w = entries[0].contentRect.width, container);
    					$$invalidate(19, container.h = entries[0].contentRect.height, container);
    					$$invalidate(7, smallScreen = container.w < 769);

    					// run child component resize function
    					if (!activeItemIsHtml()) {
    						resizeFunc?.();
    					}

    					// run user defined onResize function
    					opts.onResize?.(container.el, activeItem);
    				}

    				roActive = true;
    			});

    		ro.observe(node);

    		return {
    			destroy() {
    				ro.disconnect();
    				globalThis.removeEventListener('keydown', onKeydown);
    				closing.set(false);

    				// remove class hiding scroll
    				html.classList.remove('bp-lock');

    				opts.onClosed?.();
    			}
    		};
    	};

    	const pointerdown_handler = e => $$invalidate(9, clickedEl = e.target);

    	const pointerup_handler = function (e) {
    		// only close if left click on self and not dragged
    		if (e.button !== 2 && e.target === this && clickedEl === this) {
    			!opts.noClose && close();
    		}
    	};

    	$$self.$$set = $$props => {
    		if ('items' in $$props) $$invalidate(0, items = $$props.items);
    		if ('target' in $$props) $$invalidate(15, target = $$props.target);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*items, position, isOpen, opts, container, activeItem*/ 786545) {
    			if (items) {
    				// update active item when position changes
    				$$invalidate(6, activeItem = items[position]);

    				if (isOpen) {
    					// run onUpdate when items updated
    					opts.onUpdate?.(container.el, activeItem);
    				}
    			}
    		}
    	};

    	return [
    		items,
    		close,
    		prev,
    		next,
    		position,
    		opts,
    		activeItem,
    		smallScreen,
    		inline,
    		clickedEl,
    		$zoomed,
    		zoomed,
    		mediaTransition,
    		getChildProps,
    		containerActions,
    		target,
    		open,
    		setPosition,
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
    				target: 15,
    				open: 16,
    				close: 1,
    				prev: 2,
    				next: 3,
    				setPosition: 17
    			},
    			null,
    			[-1, -1]
    		);
    	}

    	get items() {
    		return this.$$.ctx[0];
    	}



    	get target() {
    		return this.$$.ctx[15];
    	}



    	get open() {
    		return this.$$.ctx[16];
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
    		return this.$$.ctx[17];
    	}
    }

    /**
     * Initializes BiggerPicture
     * @param {{target: HTMLElement}} options
     * @returns BiggerPicture instance
     */
    function biggerPicture (options) {
    	return new Bigger_picture({
    		...options,
    		props: options,
    	})
    }

    return biggerPicture;

}));
