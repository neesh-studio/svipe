
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
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
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
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

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
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
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\Swipe.svelte generated by Svelte v3.9.1 */

    const file = "src\\Swipe.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.x = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (266:3) {#if showIndicators}
    function create_if_block(ctx) {
    	var div;

    	var each_value = ctx.indicators;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(div, "class", "swipe-indicator swipe-indicator-inside svelte-pbdz13");
    			add_location(div, file, 266, 5, 6862);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},

    		p: function update_1(changed, ctx) {
    			if (changed.activeIndicator || changed.indicators) {
    				each_value = ctx.indicators;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (268:8) {#each indicators as x, i }
    function create_each_block(ctx) {
    	var span, span_class_value, dispose;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	return {
    		c: function create() {
    			span = element("span");
    			attr(span, "class", span_class_value = "dot " + (ctx.activeIndicator == ctx.i ? 'is-active' : '') + " svelte-pbdz13");
    			add_location(span, file, 268, 10, 6963);
    			dispose = listen(span, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    		},

    		p: function update_1(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.activeIndicator) && span_class_value !== (span_class_value = "dot " + (ctx.activeIndicator == ctx.i ? 'is-active' : '') + " svelte-pbdz13")) {
    				attr(span, "class", span_class_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}

    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div4, div2, div1, div0, t0, div3, t1, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var if_block = (ctx.showIndicators) && create_if_block(ctx);

    	return {
    		c: function create() {
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");

    			if (default_slot) default_slot.c();
    			t0 = space();
    			div3 = element("div");
    			t1 = space();
    			if (if_block) if_block.c();

    			attr(div0, "class", "swipeable-slot-wrapper svelte-pbdz13");
    			add_location(div0, file, 259, 6, 6623);
    			attr(div1, "class", "swipeable-total_elements svelte-pbdz13");
    			add_location(div1, file, 258, 4, 6577);
    			attr(div2, "class", "swipe-item-wrapper svelte-pbdz13");
    			add_location(div2, file, 257, 2, 6514);
    			attr(div3, "class", "swipe-handler svelte-pbdz13");
    			add_location(div3, file, 264, 2, 6717);
    			attr(div4, "class", "swipe-panel svelte-pbdz13");
    			add_location(div4, file, 256, 0, 6485);

    			dispose = [
    				listen(div3, "touchstart", ctx.onMoveStart),
    				listen(div3, "mousedown", ctx.onMoveStart)
    			];
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div0_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div2);
    			append(div2, div1);
    			append(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			ctx.div2_binding(div2);
    			append(div4, t0);
    			append(div4, div3);
    			ctx.div3_binding(div3);
    			append(div4, t1);
    			if (if_block) if_block.m(div4, null);
    			current = true;
    		},

    		p: function update_1(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (ctx.showIndicators) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div4, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div4);
    			}

    			if (default_slot) default_slot.d(detaching);
    			ctx.div2_binding(null);
    			ctx.div3_binding(null);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};
    }

    function normalizeEventBehavior(e) {
      e && e.preventDefault();
      e && e.stopImmediatePropagation();
      e && e.stopPropagation();
    }

    function instance($$self, $$props, $$invalidate) {
    	let { transitionDuration = 200, showIndicators = false, autoplay = false, delay = 1000, defaultIndex = 0, active_item = 0, is_vertical = false } = $$props;

      let activeIndicator = 0,
        indicators,
        total_elements = 0,
        availableSpace = 0,
        availableWidth = 0,
        swipeElements,
        availableDistance = 0,
        swipeWrapper,
        swipeHandler,
        pos_axis = 0,
        page_axis = is_vertical ? 'pageY' : 'pageX',
        axis,
        longTouch,
        last_axis_pos;



      let played = defaultIndex || 0;
      let run_interval = false;

      function init(){
        swipeElements = swipeWrapper.querySelectorAll('.swipeable-item');
        $$invalidate('total_elements', total_elements = swipeElements.length);
        update();
      }

      function update(){
        let {offsetWidth, offsetHeight} = swipeWrapper.querySelector('.swipeable-total_elements');
        availableSpace = is_vertical ? offsetHeight : offsetWidth;
         [...swipeElements].forEach((element, i) => {
          element.style.transform = generateTranslateValue(availableSpace * i);
        });
        availableDistance = 0;
        availableWidth = availableSpace * (total_elements - 1);
        if(defaultIndex){
          changeItem(defaultIndex);
        }
      }

      // helpers
      function eventDelegate(type) {
        let delegationTypes = {
          add: 'addEventListener',
          remove: 'removeEventListener'
        };
        if (typeof window !== 'undefined') {
          window[delegationTypes[type]]('mousemove', onMove);
          window[delegationTypes[type]]('mouseup', onEnd);
          window[delegationTypes[type]]('touchmove', onMove, {passive:false});
          window[delegationTypes[type]]('touchend', onEnd, {passive:false});
        }
      }

      function generateTranslateValue(value){
        return  is_vertical ? `translate3d(0, ${value}px, 0)` : `translate3d(${value}px, 0, 0)`;
      }

      function generateTouchPosCss(value, touch_end = false){
        let transformString = generateTranslateValue(value);
        let _css = `
      -webkit-transition-duration: ${touch_end ? transitionDuration : '0'}ms;
      transition-duration: ${touch_end ? transitionDuration : '0'}ms;
      -webkit-transform: ${transformString};
      -ms-transform: ${transformString};`;
        return _css;
      }


      onMount(() => {
        init();
        if (typeof window !== 'undefined') {
          window.addEventListener('resize', update);
        }
      });



      onDestroy(()=>{
        if (typeof window !== 'undefined') {
          window.removeEventListener('resize', update);
        }
      });



      let touch_active = false;

      function onMove(e){
        if (touch_active) {
          normalizeEventBehavior(e);
          let _axis = e.touches ? e.touches[0][page_axis] : e[page_axis],
            distance = (axis - _axis) + pos_axis;
          if (distance <= availableWidth && distance >= 0) {
            [...swipeElements].forEach((element, i) => {
              element.style.cssText = generateTouchPosCss((availableSpace * i) - distance);
            });
            availableDistance = distance;
            last_axis_pos = _axis;
          }
        }
      }

      function onMoveStart(e){
        normalizeEventBehavior(e);
        touch_active = true;
        longTouch = false;
        setTimeout(function() {
          longTouch = true;
        }, 250);
        axis = e.touches ? e.touches[0][page_axis] : e[page_axis];
        eventDelegate('add');
      }

      function onEnd(e) {
        normalizeEventBehavior(e);
        let direction = axis < last_axis_pos;
        touch_active = false;
        let _as = availableSpace;
        let accidental_touch = Math.round(availableSpace / 50) > Math.abs(axis - last_axis_pos);
        if(longTouch || accidental_touch){
          availableDistance = Math.round((availableDistance / _as)) * _as;
        }else{
          availableDistance = direction ? Math.floor((availableDistance / _as))  * _as : Math.ceil((availableDistance / _as))  * _as;
        }

        axis = null;
        last_axis_pos = null;
        pos_axis = availableDistance;
        $$invalidate('activeIndicator', activeIndicator = (availableDistance / _as));

        [...swipeElements].forEach((element, i) => {
          element.style.cssText = generateTouchPosCss((_as * i) - pos_axis, true);
        });

        $$invalidate('active_item', active_item = activeIndicator);
        $$invalidate('defaultIndex', defaultIndex = active_item);
        eventDelegate('remove');
      }

      function changeItem(item) {
        let max = availableSpace;
        availableDistance = max * item;
        $$invalidate('activeIndicator', activeIndicator = item);
        onEnd();
      }

      function changeView() {
        changeItem(played);
        played = played < (total_elements - 1) ? ++played : 0;  }

      function goTo(step) {
        let item = Math.max(0, Math.min(step, indicators.length - 1));
        changeItem(item);
      }
      function prevItem() {
        let step = activeIndicator - 1;
        goTo(step);
      }

      function nextItem() {
        let step = activeIndicator + 1;
        goTo(step);
      }

    	const writable_props = ['transitionDuration', 'showIndicators', 'autoplay', 'delay', 'defaultIndex', 'active_item', 'is_vertical'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Swipe> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('swipeWrapper', swipeWrapper = $$value);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('swipeHandler', swipeHandler = $$value);
    		});
    	}

    	function click_handler({ i }) {changeItem(i);}

    	$$self.$set = $$props => {
    		if ('transitionDuration' in $$props) $$invalidate('transitionDuration', transitionDuration = $$props.transitionDuration);
    		if ('showIndicators' in $$props) $$invalidate('showIndicators', showIndicators = $$props.showIndicators);
    		if ('autoplay' in $$props) $$invalidate('autoplay', autoplay = $$props.autoplay);
    		if ('delay' in $$props) $$invalidate('delay', delay = $$props.delay);
    		if ('defaultIndex' in $$props) $$invalidate('defaultIndex', defaultIndex = $$props.defaultIndex);
    		if ('active_item' in $$props) $$invalidate('active_item', active_item = $$props.active_item);
    		if ('is_vertical' in $$props) $$invalidate('is_vertical', is_vertical = $$props.is_vertical);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = ($$dirty = { total_elements: 1, autoplay: 1, run_interval: 1, delay: 1 }) => {
    		if ($$dirty.total_elements) { $$invalidate('indicators', indicators = Array(total_elements)); }
    		if ($$dirty.autoplay || $$dirty.run_interval || $$dirty.delay) { {
            if(autoplay && !run_interval){
              $$invalidate('run_interval', run_interval = setInterval(changeView , delay));
            }
        
            if(!autoplay && run_interval){
              clearInterval(run_interval);
              $$invalidate('run_interval', run_interval = false);
            }
          } }
    	};

    	return {
    		transitionDuration,
    		showIndicators,
    		autoplay,
    		delay,
    		defaultIndex,
    		active_item,
    		is_vertical,
    		activeIndicator,
    		indicators,
    		swipeWrapper,
    		swipeHandler,
    		onMoveStart,
    		changeItem,
    		goTo,
    		prevItem,
    		nextItem,
    		div2_binding,
    		div3_binding,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class Swipe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["transitionDuration", "showIndicators", "autoplay", "delay", "defaultIndex", "active_item", "is_vertical", "goTo", "prevItem", "nextItem"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.goTo === undefined && !('goTo' in props)) {
    			console.warn("<Swipe> was created without expected prop 'goTo'");
    		}
    		if (ctx.prevItem === undefined && !('prevItem' in props)) {
    			console.warn("<Swipe> was created without expected prop 'prevItem'");
    		}
    		if (ctx.nextItem === undefined && !('nextItem' in props)) {
    			console.warn("<Swipe> was created without expected prop 'nextItem'");
    		}
    	}

    	get transitionDuration() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionDuration(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showIndicators() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showIndicators(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoplay() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoplay(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get delay() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set delay(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get defaultIndex() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set defaultIndex(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active_item() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active_item(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get is_vertical() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set is_vertical(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get goTo() {
    		return this.$$.ctx.goTo;
    	}

    	set goTo(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prevItem() {
    		return this.$$.ctx.prevItem;
    	}

    	set prevItem(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nextItem() {
    		return this.$$.ctx.nextItem;
    	}

    	set nextItem(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\SwipeItem.svelte generated by Svelte v3.9.1 */

    const file$1 = "src\\SwipeItem.svelte";

    function create_fragment$1(ctx) {
    	var div, div_class_value, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr(div, "class", div_class_value = "swipeable-item " + ctx.classes + " svelte-exn8e7");
    			add_location(div, file$1, 15, 0, 224);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if ((!current || changed.classes) && div_class_value !== (div_class_value = "swipeable-item " + ctx.classes + " svelte-exn8e7")) {
    				attr(div, "class", div_class_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { classes = '' } = $$props;

    	const writable_props = ['classes'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<SwipeItem> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('classes' in $$props) $$invalidate('classes', classes = $$props.classes);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { classes, $$slots, $$scope };
    }

    class SwipeItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["classes"]);
    	}

    	get classes() {
    		throw new Error("<SwipeItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<SwipeItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* dev\App.svelte generated by Svelte v3.9.1 */

    const file$2 = "dev\\App.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.image = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.image = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.image = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.tab = list[i];
    	return child_ctx;
    }

    // (165:6) {#each tabs as tab}
    function create_each_block_3(ctx) {
    	var li, button, t0_value = ctx.tab.name + "", t0, button_class_value, t1, dispose;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	return {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(button, "class", button_class_value = "nav-link " + (ctx.tab.value == ctx.active_tab ? 'active' : '') + " svelte-giv8mn");
    			attr(button, "type", "button");
    			add_location(button, file$2, 166, 10, 4001);
    			attr(li, "class", "nav-item svelte-giv8mn");
    			add_location(li, file$2, 165, 8, 3936);
    			dispose = listen(li, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, button);
    			append(button, t0);
    			append(li, t1);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.active_tab) && button_class_value !== (button_class_value = "nav-link " + (ctx.tab.value == ctx.active_tab ? 'active' : '') + " svelte-giv8mn")) {
    				attr(button, "class", button_class_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}

    			dispose();
    		}
    	};
    }

    // (200:22) <SwipeItem>
    function create_default_slot_8(ctx) {
    	var img, img_src_value, t;

    	return {
    		c: function create() {
    			img = element("img");
    			t = space();
    			attr(img, "class", "img-fluid svelte-giv8mn");
    			attr(img, "src", img_src_value = ctx.image);
    			attr(img, "alt", "");
    			add_location(img, file$2, 200, 24, 5420);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    			insert(target, t, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    				detach(t);
    			}
    		}
    	};
    }

    // (199:20) {#each images as image}
    function create_each_block_2(ctx) {
    	var current;

    	var swipeitem = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_8] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			swipeitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(swipeitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var swipeitem_changes = {};
    			if (changed.$$scope) swipeitem_changes.$$scope = { changed, ctx };
    			swipeitem.$set(swipeitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipeitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(swipeitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(swipeitem, detaching);
    		}
    	};
    }

    // (198:18) <Swipe {...swipeConfig} bind:active_item bind:this={SwipeComp}>
    function create_default_slot_7(ctx) {
    	var each_1_anchor, current;

    	var each_value_2 = ctx.images;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.images) {
    				each_value_2 = ctx.images;

    				for (var i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value_2.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value_2.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (216:14) {#if customThumbnail}
    function create_if_block_3(ctx) {
    	var div1, div0;

    	var each_value_1 = ctx.images;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	return {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(div0, "class", "is-center svelte-giv8mn");
    			add_location(div0, file$2, 217, 18, 6035);
    			attr(div1, "class", "col svelte-giv8mn");
    			add_location(div1, file$2, 216, 16, 5998);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.active_item || changed.images) {
    				each_value_1 = ctx.images;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value_1.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (219:20) {#each images as image, i}
    function create_each_block_1(ctx) {
    	var img, img_class_value, img_src_value, dispose;

    	function click_handler_1() {
    		return ctx.click_handler_1(ctx);
    	}

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "class", img_class_value = "img-fluid " + (ctx.active_item == ctx.i ? 'rounded' : 'img-thumbnail') + " svelte-giv8mn");
    			set_style(img, "height", "30px");
    			set_style(img, "width", "30px");
    			set_style(img, "cursor", "pointer");
    			attr(img, "src", img_src_value = ctx.image);
    			attr(img, "alt", "");
    			add_location(img, file$2, 219, 22, 6130);
    			dispose = listen(img, "click", click_handler_1);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.active_item) && img_class_value !== (img_class_value = "img-fluid " + (ctx.active_item == ctx.i ? 'rounded' : 'img-thumbnail') + " svelte-giv8mn")) {
    				attr(img, "class", img_class_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    			}

    			dispose();
    		}
    	};
    }

    // (249:8) {#if active_tab == 'vertical'}
    function create_if_block_2(ctx) {
    	var div3, p, t_1, div2, div1, div0, current;

    	var swipe = new Swipe({
    		props: {
    		is_vertical: true,
    		$$slots: { default: [create_default_slot_5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div3 = element("div");
    			p = element("p");
    			p.textContent = "Vertical Swipe 🔥";
    			t_1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			swipe.$$.fragment.c();
    			attr(p, "class", "lead svelte-giv8mn");
    			add_location(p, file$2, 250, 12, 7231);
    			attr(div0, "class", "swipe-holder svelte-giv8mn");
    			add_location(div0, file$2, 253, 16, 7350);
    			attr(div1, "class", "col svelte-giv8mn");
    			add_location(div1, file$2, 252, 14, 7315);
    			attr(div2, "class", "row svelte-giv8mn");
    			add_location(div2, file$2, 251, 12, 7282);
    			attr(div3, "class", "tab-pane fade show active svelte-giv8mn");
    			add_location(div3, file$2, 249, 10, 7178);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, p);
    			append(div3, t_1);
    			append(div3, div2);
    			append(div2, div1);
    			append(div1, div0);
    			mount_component(swipe, div0, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var swipe_changes = {};
    			if (changed.$$scope) swipe_changes.$$scope = { changed, ctx };
    			swipe.$set(swipe_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipe.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(swipe.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div3);
    			}

    			destroy_component(swipe);
    		}
    	};
    }

    // (257:22) <SwipeItem>
    function create_default_slot_6(ctx) {
    	var img, img_src_value, t;

    	return {
    		c: function create() {
    			img = element("img");
    			t = space();
    			attr(img, "class", "img-fluid svelte-giv8mn");
    			attr(img, "src", img_src_value = ctx.image);
    			attr(img, "alt", "");
    			add_location(img, file$2, 257, 24, 7528);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    			insert(target, t, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    				detach(t);
    			}
    		}
    	};
    }

    // (256:20) {#each images as image}
    function create_each_block$1(ctx) {
    	var current;

    	var swipeitem = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_6] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			swipeitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(swipeitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var swipeitem_changes = {};
    			if (changed.$$scope) swipeitem_changes.$$scope = { changed, ctx };
    			swipeitem.$set(swipeitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipeitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(swipeitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(swipeitem, detaching);
    		}
    	};
    }

    // (255:18) <Swipe is_vertical={true}>
    function create_default_slot_5(ctx) {
    	var each_1_anchor, current;

    	var each_value = ctx.images;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.images) {
    				each_value = ctx.images;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (267:8) {#if active_tab == 'allow-pointer'}
    function create_if_block_1(ctx) {
    	var div1, p, t_1, div0, current;

    	var swipe = new Swipe({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "Also allow pointer events inside Swipe Item";
    			t_1 = space();
    			div0 = element("div");
    			swipe.$$.fragment.c();
    			attr(p, "class", "lead svelte-giv8mn");
    			add_location(p, file$2, 268, 12, 7873);
    			attr(div0, "class", "swipe-holder svelte-giv8mn");
    			add_location(div0, file$2, 269, 12, 7950);
    			attr(div1, "class", "tab-pane fade show active svelte-giv8mn");
    			add_location(div1, file$2, 267, 10, 7820);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, p);
    			append(div1, t_1);
    			append(div1, div0);
    			mount_component(swipe, div0, null);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipe.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(swipe.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			destroy_component(swipe);
    		}
    	};
    }

    // (272:16) <SwipeItem>
    function create_default_slot_4(ctx) {
    	var div, button, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Say Hi";
    			attr(button, "class", "custom-button has-pointer-event svelte-giv8mn");
    			add_location(button, file$2, 273, 20, 8126);
    			attr(div, "class", "is-stack is-center svelte-giv8mn");
    			set_style(div, "background", "teal");
    			add_location(div, file$2, 272, 18, 8048);
    			dispose = listen(button, "click", sayHi);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    // (280:16) <SwipeItem>
    function create_default_slot_3(ctx) {
    	var div, button, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Say Hi";
    			attr(button, "class", "custom-button has-pointer-event svelte-giv8mn");
    			add_location(button, file$2, 281, 20, 8444);
    			attr(div, "class", "is-stack is-center svelte-giv8mn");
    			set_style(div, "background", "yellowgreen");
    			add_location(div, file$2, 280, 18, 8359);
    			dispose = listen(button, "click", sayHi);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    // (288:16) <SwipeItem>
    function create_default_slot_2(ctx) {
    	var div, button, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Say Hi";
    			attr(button, "class", "custom-button has-pointer-event svelte-giv8mn");
    			add_location(button, file$2, 289, 20, 8755);
    			attr(div, "class", "is-stack is-center svelte-giv8mn");
    			set_style(div, "background", "aqua");
    			add_location(div, file$2, 288, 18, 8677);
    			dispose = listen(button, "click", sayHi);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    // (296:16) <SwipeItem>
    function create_default_slot_1(ctx) {
    	var div, button, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Say Hi";
    			attr(button, "class", "custom-button has-pointer-event svelte-giv8mn");
    			add_location(button, file$2, 297, 20, 9072);
    			attr(div, "class", "is-stack is-center svelte-giv8mn");
    			set_style(div, "background", "lightcoral");
    			add_location(div, file$2, 296, 18, 8988);
    			dispose = listen(button, "click", sayHi);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    // (271:14) <Swipe>
    function create_default_slot(ctx) {
    	var t0, t1, t2, current;

    	var swipeitem0 = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var swipeitem1 = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var swipeitem2 = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var swipeitem3 = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			swipeitem0.$$.fragment.c();
    			t0 = space();
    			swipeitem1.$$.fragment.c();
    			t1 = space();
    			swipeitem2.$$.fragment.c();
    			t2 = space();
    			swipeitem3.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(swipeitem0, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(swipeitem1, target, anchor);
    			insert(target, t1, anchor);
    			mount_component(swipeitem2, target, anchor);
    			insert(target, t2, anchor);
    			mount_component(swipeitem3, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var swipeitem0_changes = {};
    			if (changed.$$scope) swipeitem0_changes.$$scope = { changed, ctx };
    			swipeitem0.$set(swipeitem0_changes);

    			var swipeitem1_changes = {};
    			if (changed.$$scope) swipeitem1_changes.$$scope = { changed, ctx };
    			swipeitem1.$set(swipeitem1_changes);

    			var swipeitem2_changes = {};
    			if (changed.$$scope) swipeitem2_changes.$$scope = { changed, ctx };
    			swipeitem2.$set(swipeitem2_changes);

    			var swipeitem3_changes = {};
    			if (changed.$$scope) swipeitem3_changes.$$scope = { changed, ctx };
    			swipeitem3.$set(swipeitem3_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipeitem0.$$.fragment, local);

    			transition_in(swipeitem1.$$.fragment, local);

    			transition_in(swipeitem2.$$.fragment, local);

    			transition_in(swipeitem3.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(swipeitem0.$$.fragment, local);
    			transition_out(swipeitem1.$$.fragment, local);
    			transition_out(swipeitem2.$$.fragment, local);
    			transition_out(swipeitem3.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(swipeitem0, detaching);

    			if (detaching) {
    				detach(t0);
    			}

    			destroy_component(swipeitem1, detaching);

    			if (detaching) {
    				detach(t1);
    			}

    			destroy_component(swipeitem2, detaching);

    			if (detaching) {
    				detach(t2);
    			}

    			destroy_component(swipeitem3, detaching);
    		}
    	};
    }

    // (307:8) {#if active_tab == 'dynamic-height'}
    function create_if_block$1(ctx) {
    	var div, p;

    	return {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Dynamic height with children";
    			attr(p, "class", "lead svelte-giv8mn");
    			add_location(p, file$2, 308, 12, 9442);
    			attr(div, "class", "tab-pane fade show active svelte-giv8mn");
    			add_location(div, file$2, 307, 10, 9389);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, p);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var a, svg, path0, path1, path2, t0, div19, div1, div0, h1, t2, p, t4, div3, div2, ul, t5, div18, div17, div16, div15, div7, div6, div4, input0, t6, label0, t8, div5, input1, t9, label1, t11, div10, div9, div8, updating_active_item, t12, div14, div11, input2, input2_value_value, t13, t14, div13, div12, button0, t16, button1, div15_class_value, t18, t19, t20, current, dispose;

    	var each_value_3 = ctx.tabs;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	var swipe_spread_levels = [
    		ctx.swipeConfig
    	];

    	function swipe_active_item_binding(value) {
    		ctx.swipe_active_item_binding.call(null, value);
    		updating_active_item = true;
    		add_flush_callback(() => updating_active_item = false);
    	}

    	let swipe_props = {
    		$$slots: { default: [create_default_slot_7] },
    		$$scope: { ctx }
    	};
    	for (var i = 0; i < swipe_spread_levels.length; i += 1) {
    		swipe_props = assign(swipe_props, swipe_spread_levels[i]);
    	}
    	if (ctx.active_item !== void 0) {
    		swipe_props.active_item = ctx.active_item;
    	}
    	var swipe = new Swipe({ props: swipe_props, $$inline: true });

    	binding_callbacks.push(() => bind(swipe, 'active_item', swipe_active_item_binding));
    	ctx.swipe_binding(swipe);

    	var if_block0 = (ctx.customThumbnail) && create_if_block_3(ctx);

    	var if_block1 = (ctx.active_tab == 'vertical') && create_if_block_2(ctx);

    	var if_block2 = (ctx.active_tab == 'allow-pointer') && create_if_block_1(ctx);

    	var if_block3 = (ctx.active_tab == 'dynamic-height') && create_if_block$1();

    	return {
    		c: function create() {
    			a = element("a");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			t0 = space();
    			div19 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Svelte Swipe";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Swipable items wrapper component for Svelte";
    			t4 = space();
    			div3 = element("div");
    			div2 = element("div");
    			ul = element("ul");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div18 = element("div");
    			div17 = element("div");
    			div16 = element("div");
    			div15 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div4 = element("div");
    			input0 = element("input");
    			t6 = space();
    			label0 = element("label");
    			label0.textContent = "Built-in Indicators";
    			t8 = space();
    			div5 = element("div");
    			input1 = element("input");
    			t9 = space();
    			label1 = element("label");
    			label1.textContent = "Custom Thumbnail";
    			t11 = space();
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			swipe.$$.fragment.c();
    			t12 = space();
    			div14 = element("div");
    			div11 = element("div");
    			input2 = element("input");
    			t13 = space();
    			if (if_block0) if_block0.c();
    			t14 = space();
    			div13 = element("div");
    			div12 = element("div");
    			button0 = element("button");
    			button0.textContent = "Prev";
    			t16 = space();
    			button1 = element("button");
    			button1.textContent = "Next";
    			t18 = space();
    			if (if_block1) if_block1.c();
    			t19 = space();
    			if (if_block2) if_block2.c();
    			t20 = space();
    			if (if_block3) if_block3.c();
    			attr(path0, "d", "M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z");
    			attr(path0, "class", "svelte-giv8mn");
    			add_location(path0, file$2, 133, 4, 2525);
    			attr(path1, "d", "M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6\r\n      120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3\r\n      125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2");
    			attr(path1, "fill", "currentColor");
    			set_style(path1, "transform-origin", "130px 106px");
    			attr(path1, "class", "octo-arm svelte-giv8mn");
    			add_location(path1, file$2, 134, 4, 2593);
    			attr(path2, "d", "M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6\r\n      C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0\r\n      C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1\r\n      C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4\r\n      C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9\r\n      C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5\r\n      C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9\r\n      L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z");
    			attr(path2, "fill", "currentColor");
    			attr(path2, "class", "octo-body svelte-giv8mn");
    			add_location(path2, file$2, 141, 4, 2914);
    			attr(svg, "width", "80");
    			attr(svg, "height", "80");
    			attr(svg, "viewBox", "0 0 250 250");
    			set_style(svg, "fill", "#151513");
    			set_style(svg, "color", "#fff");
    			set_style(svg, "position", "absolute");
    			set_style(svg, "top", "0");
    			set_style(svg, "border", "0");
    			set_style(svg, "right", "0");
    			attr(svg, "aria-hidden", "true");
    			attr(svg, "class", "svelte-giv8mn");
    			add_location(svg, file$2, 126, 2, 2337);
    			attr(a, "href", "https://github.com/SharifClick/svelte-swipe");
    			attr(a, "class", "github-corner svelte-giv8mn");
    			attr(a, "aria-label", "View source on GitHub");
    			add_location(a, file$2, 122, 0, 2213);
    			attr(h1, "class", "text-muted svelte-giv8mn");
    			add_location(h1, file$2, 157, 6, 3683);
    			attr(p, "class", "text-muted svelte-giv8mn");
    			add_location(p, file$2, 158, 6, 3731);
    			attr(div0, "class", "col svelte-giv8mn");
    			add_location(div0, file$2, 156, 4, 3658);
    			attr(div1, "class", "row svelte-giv8mn");
    			set_style(div1, "margin-top", "20px");
    			add_location(div1, file$2, 155, 2, 3611);
    			attr(ul, "class", "nav nav-tabs svelte-giv8mn");
    			add_location(ul, file$2, 163, 6, 3874);
    			attr(div2, "class", "col svelte-giv8mn");
    			add_location(div2, file$2, 162, 4, 3849);
    			attr(div3, "class", "row svelte-giv8mn");
    			add_location(div3, file$2, 161, 2, 3826);
    			attr(input0, "class", "form-check-input svelte-giv8mn");
    			attr(input0, "type", "checkbox");
    			add_location(input0, file$2, 179, 18, 4499);
    			attr(label0, "class", "text-muted svelte-giv8mn");
    			add_location(label0, file$2, 183, 18, 4674);
    			attr(div4, "class", "form-check form-check-inline float-right svelte-giv8mn");
    			add_location(div4, file$2, 178, 16, 4425);
    			attr(input1, "class", "form-check-input svelte-giv8mn");
    			attr(input1, "type", "checkbox");
    			add_location(input1, file$2, 186, 18, 4843);
    			attr(label1, "class", "text-muted svelte-giv8mn");
    			add_location(label1, file$2, 190, 18, 5007);
    			attr(div5, "class", "form-check form-check-inline float-right svelte-giv8mn");
    			add_location(div5, file$2, 185, 16, 4769);
    			attr(div6, "class", "col svelte-giv8mn");
    			add_location(div6, file$2, 177, 14, 4390);
    			attr(div7, "class", "row svelte-giv8mn");
    			add_location(div7, file$2, 176, 12, 4357);
    			attr(div8, "class", "swipe-holder svelte-giv8mn");
    			add_location(div8, file$2, 196, 16, 5205);
    			attr(div9, "class", "col svelte-giv8mn");
    			add_location(div9, file$2, 195, 14, 5170);
    			attr(div10, "class", "row svelte-giv8mn");
    			add_location(div10, file$2, 194, 12, 5137);
    			attr(input2, "class", "btn btn-info btn-sm svelte-giv8mn");
    			attr(input2, "type", "button");
    			input2.value = input2_value_value = ctx.swipeConfig.autoplay ? 'Stop' : 'Play';
    			add_location(input2, file$2, 209, 16, 5729);
    			attr(div11, "class", "col svelte-giv8mn");
    			add_location(div11, file$2, 208, 14, 5694);
    			attr(button0, "type", "button");
    			attr(button0, "class", "btn btn-secondary btn-sm svelte-giv8mn");
    			add_location(button0, file$2, 231, 18, 6632);
    			attr(button1, "type", "button");
    			attr(button1, "class", "btn btn-secondary btn-sm svelte-giv8mn");
    			add_location(button1, file$2, 237, 18, 6846);
    			attr(div12, "class", "btn-group float-right svelte-giv8mn");
    			add_location(div12, file$2, 230, 16, 6577);
    			attr(div13, "class", "col svelte-giv8mn");
    			add_location(div13, file$2, 229, 14, 6542);
    			attr(div14, "class", "row svelte-giv8mn");
    			set_style(div14, "margin-top", "10px");
    			add_location(div14, file$2, 207, 12, 5637);
    			attr(div15, "class", div15_class_value = "tab-pane fade " + (ctx.active_tab == 'default' ? 'show active' : '') + " svelte-giv8mn");
    			add_location(div15, file$2, 175, 10, 4269);
    			attr(div16, "class", "tab-content svelte-giv8mn");
    			add_location(div16, file$2, 174, 8, 4232);
    			attr(div17, "class", "col svelte-giv8mn");
    			add_location(div17, file$2, 173, 4, 4205);
    			attr(div18, "class", "row top-buffer svelte-giv8mn");
    			add_location(div18, file$2, 172, 2, 4171);
    			attr(div19, "class", "container svelte-giv8mn");
    			add_location(div19, file$2, 154, 0, 3584);

    			dispose = [
    				listen(input0, "change", ctx.input0_change_handler),
    				listen(input1, "change", ctx.input1_change_handler),
    				listen(input2, "click", ctx.toggle),
    				listen(button0, "click", ctx.prevSlide),
    				listen(button1, "click", ctx.nextSlide)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, svg);
    			append(svg, path0);
    			append(svg, path1);
    			append(svg, path2);
    			insert(target, t0, anchor);
    			insert(target, div19, anchor);
    			append(div19, div1);
    			append(div1, div0);
    			append(div0, h1);
    			append(div0, t2);
    			append(div0, p);
    			append(div19, t4);
    			append(div19, div3);
    			append(div3, div2);
    			append(div2, ul);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append(div19, t5);
    			append(div19, div18);
    			append(div18, div17);
    			append(div17, div16);
    			append(div16, div15);
    			append(div15, div7);
    			append(div7, div6);
    			append(div6, div4);
    			append(div4, input0);

    			input0.checked = ctx.swipeConfig.showIndicators;

    			append(div4, t6);
    			append(div4, label0);
    			append(div6, t8);
    			append(div6, div5);
    			append(div5, input1);

    			input1.checked = ctx.customThumbnail;

    			append(div5, t9);
    			append(div5, label1);
    			append(div15, t11);
    			append(div15, div10);
    			append(div10, div9);
    			append(div9, div8);
    			mount_component(swipe, div8, null);
    			append(div15, t12);
    			append(div15, div14);
    			append(div14, div11);
    			append(div11, input2);
    			append(div14, t13);
    			if (if_block0) if_block0.m(div14, null);
    			append(div14, t14);
    			append(div14, div13);
    			append(div13, div12);
    			append(div12, button0);
    			append(div12, t16);
    			append(div12, button1);
    			append(div16, t18);
    			if (if_block1) if_block1.m(div16, null);
    			append(div16, t19);
    			if (if_block2) if_block2.m(div16, null);
    			append(div16, t20);
    			if (if_block3) if_block3.m(div16, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.tabs || changed.active_tab) {
    				each_value_3 = ctx.tabs;

    				for (var i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value_3.length;
    			}

    			if (changed.swipeConfig) input0.checked = ctx.swipeConfig.showIndicators;
    			if (changed.customThumbnail) input1.checked = ctx.customThumbnail;

    			var swipe_changes = (changed.swipeConfig) ? get_spread_update(swipe_spread_levels, [
    									ctx.swipeConfig
    								]) : {};
    			if (changed.$$scope) swipe_changes.$$scope = { changed, ctx };
    			if (!updating_active_item && changed.active_item) {
    				swipe_changes.active_item = ctx.active_item;
    			}
    			swipe.$set(swipe_changes);

    			if ((!current || changed.swipeConfig) && input2_value_value !== (input2_value_value = ctx.swipeConfig.autoplay ? 'Stop' : 'Play')) {
    				input2.value = input2_value_value;
    			}

    			if (ctx.customThumbnail) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div14, t14);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if ((!current || changed.active_tab) && div15_class_value !== (div15_class_value = "tab-pane fade " + (ctx.active_tab == 'default' ? 'show active' : '') + " svelte-giv8mn")) {
    				attr(div15, "class", div15_class_value);
    			}

    			if (ctx.active_tab == 'vertical') {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div16, t19);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}

    			if (ctx.active_tab == 'allow-pointer') {
    				if (!if_block2) {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div16, t20);
    				} else {
    									transition_in(if_block2, 1);
    				}
    			} else if (if_block2) {
    				group_outros();
    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});
    				check_outros();
    			}

    			if (ctx.active_tab == 'dynamic-height') {
    				if (!if_block3) {
    					if_block3 = create_if_block$1();
    					if_block3.c();
    					if_block3.m(div16, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipe.$$.fragment, local);

    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(swipe.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    				detach(t0);
    				detach(div19);
    			}

    			destroy_each(each_blocks, detaching);

    			ctx.swipe_binding(null);

    			destroy_component(swipe);

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			run_all(dispose);
    		}
    	};
    }

    function sayHi() {
      alert("Hi");
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const swipeConfig = {
        autoplay: false,
        showIndicators: false,
        transitionDuration: 200,
        defaultIndex: 0
      };

      let active_item = 0; //readonly

      let customThumbnail = false;

      let SwipeComp;

      function toggle() {
        swipeConfig.autoplay = !swipeConfig.autoplay; $$invalidate('swipeConfig', swipeConfig);
      }

      function nextSlide() {
        SwipeComp.nextItem();
      }

      function prevSlide() {
        SwipeComp.prevItem();
      }

      function changeSlide(i) {
        SwipeComp.goTo(i);
      }

      let images = [
        "./images/1.jpg",
        "./images/2.jpg",
        "./images/3.jpg",
        "./images/4.jpg"
      ];

      let tabs = [
        {name:'Deafult', value:'default'},
        {name:'Vertical', value:'vertical'},
        {name:'Allow Pointer', value:'allow-pointer'},
        {name:'Dynamic Height', value:'dynamic-height'},
      ];
      let active_tab = 'default';

      function changeTab(tab) {
        $$invalidate('active_tab', active_tab = tab.value);
      }

    	function click_handler({ tab }) {
    		return changeTab(tab);
    	}

    	function input0_change_handler() {
    		swipeConfig.showIndicators = this.checked;
    		$$invalidate('swipeConfig', swipeConfig);
    	}

    	function input1_change_handler() {
    		customThumbnail = this.checked;
    		$$invalidate('customThumbnail', customThumbnail);
    	}

    	function swipe_active_item_binding(value) {
    		active_item = value;
    		$$invalidate('active_item', active_item);
    	}

    	function swipe_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('SwipeComp', SwipeComp = $$value);
    		});
    	}

    	function click_handler_1({ i }) {
    		return changeSlide(i);
    	}

    	return {
    		swipeConfig,
    		active_item,
    		customThumbnail,
    		SwipeComp,
    		toggle,
    		nextSlide,
    		prevSlide,
    		changeSlide,
    		images,
    		tabs,
    		active_tab,
    		changeTab,
    		click_handler,
    		input0_change_handler,
    		input1_change_handler,
    		swipe_active_item_binding,
    		swipe_binding,
    		click_handler_1
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
