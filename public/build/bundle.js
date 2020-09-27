
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
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
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
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
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.25.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
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
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\common\SiteNavigation.svelte generated by Svelte v3.25.1 */

    const file = "src\\components\\common\\SiteNavigation.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (54:4) {#each sections as section}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t_value = /*section*/ ctx[1].name + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", a_href_value = /*section*/ ctx[1].url);
    			attr_dev(a, "class", "svelte-1ojeis4");
    			add_location(a, file, 54, 10, 983);
    			attr_dev(li, "class", "svelte-1ojeis4");
    			add_location(li, file, 54, 6, 979);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(54:4) {#each sections as section}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let nav;
    	let ul;
    	let each_value = /*sections*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-1ojeis4");
    			add_location(ul, file, 52, 2, 934);
    			attr_dev(nav, "class", "site-nav svelte-1ojeis4");
    			add_location(nav, file, 51, 0, 908);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sections*/ 1) {
    				each_value = /*sections*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SiteNavigation", slots, []);

    	let sections = [
    		{ name: "About", url: "/about" },
    		{ name: "Contacts", url: "/contacts" },
    		{ name: "Services", url: "/services" },
    		{ name: "Projects", url: "/projects" }
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SiteNavigation> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ sections });

    	$$self.$inject_state = $$props => {
    		if ("sections" in $$props) $$invalidate(0, sections = $$props.sections);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sections];
    }

    class SiteNavigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SiteNavigation",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\components\common\SiteHeader.svelte generated by Svelte v3.25.1 */
    const file$1 = "src\\components\\common\\SiteHeader.svelte";

    function create_fragment$1(ctx) {
    	let header;
    	let a;
    	let div0;
    	let t1;
    	let sitenavigation;
    	let t2;
    	let div1;
    	let current;
    	sitenavigation = new SiteNavigation({ $$inline: true });

    	const block = {
    		c: function create() {
    			header = element("header");
    			a = element("a");
    			div0 = element("div");
    			div0.textContent = "SomeSite";
    			t1 = space();
    			create_component(sitenavigation.$$.fragment);
    			t2 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "svelte-1bixfbo");
    			add_location(div0, file$1, 36, 4, 726);
    			attr_dev(a, "href", "/");
    			attr_dev(a, "class", "site-logo svelte-1bixfbo");
    			add_location(a, file$1, 35, 2, 690);
    			attr_dev(div1, "class", "site-search svelte-1bixfbo");
    			add_location(div1, file$1, 41, 2, 783);
    			attr_dev(header, "class", "site-header svelte-1bixfbo");
    			add_location(header, file$1, 34, 0, 658);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, a);
    			append_dev(a, div0);
    			append_dev(header, t1);
    			mount_component(sitenavigation, header, null);
    			append_dev(header, t2);
    			append_dev(header, div1);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sitenavigation.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sitenavigation.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(sitenavigation);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SiteHeader", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SiteHeader> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ SiteNavigation });
    	return [];
    }

    class SiteHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SiteHeader",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\components\post-preview\PostPreviewCategory.svelte generated by Svelte v3.25.1 */

    const file$2 = "src\\components\\post-preview\\PostPreviewCategory.svelte";

    function create_fragment$2(ctx) {
    	let a;
    	let t;
    	let a_class_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(/*name*/ ctx[1]);
    			attr_dev(a, "href", /*url*/ ctx[0]);
    			attr_dev(a, "class", a_class_value = "post-cat " + /*classes*/ ctx[2] + " svelte-1l53fas");
    			add_location(a, file$2, 38, 0, 604);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 2) set_data_dev(t, /*name*/ ctx[1]);

    			if (dirty & /*url*/ 1) {
    				attr_dev(a, "href", /*url*/ ctx[0]);
    			}

    			if (dirty & /*classes*/ 4 && a_class_value !== (a_class_value = "post-cat " + /*classes*/ ctx[2] + " svelte-1l53fas")) {
    				attr_dev(a, "class", a_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PostPreviewCategory", slots, []);
    	let { url } = $$props;
    	let { name } = $$props;
    	let { classes } = $$props;
    	const writable_props = ["url", "name", "classes"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPreviewCategory> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("classes" in $$props) $$invalidate(2, classes = $$props.classes);
    	};

    	$$self.$capture_state = () => ({ url, name, classes });

    	$$self.$inject_state = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("classes" in $$props) $$invalidate(2, classes = $$props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [url, name, classes];
    }

    class PostPreviewCategory extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { url: 0, name: 1, classes: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPreviewCategory",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*url*/ ctx[0] === undefined && !("url" in props)) {
    			console.warn("<PostPreviewCategory> was created without expected prop 'url'");
    		}

    		if (/*name*/ ctx[1] === undefined && !("name" in props)) {
    			console.warn("<PostPreviewCategory> was created without expected prop 'name'");
    		}

    		if (/*classes*/ ctx[2] === undefined && !("classes" in props)) {
    			console.warn("<PostPreviewCategory> was created without expected prop 'classes'");
    		}
    	}

    	get url() {
    		throw new Error("<PostPreviewCategory>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<PostPreviewCategory>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<PostPreviewCategory>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<PostPreviewCategory>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<PostPreviewCategory>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<PostPreviewCategory>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\post-preview\PostPreviewThumb.svelte generated by Svelte v3.25.1 */
    const file$3 = "src\\components\\post-preview\\PostPreviewThumb.svelte";

    // (60:2) {:else}
    function create_else_block(ctx) {
    	let picture;
    	let img_1;
    	let img_1_src_value;

    	const block = {
    		c: function create() {
    			picture = element("picture");
    			img_1 = element("img");
    			if (img_1.src !== (img_1_src_value = /*img*/ ctx[1])) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "alt", /*imgAlt*/ ctx[4]);
    			attr_dev(img_1, "class", "svelte-cbng5n");
    			add_location(img_1, file$3, 59, 19, 1141);
    			add_location(picture, file$3, 59, 9, 1131);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, picture, anchor);
    			append_dev(picture, img_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*img*/ 2 && img_1.src !== (img_1_src_value = /*img*/ ctx[1])) {
    				attr_dev(img_1, "src", img_1_src_value);
    			}

    			if (dirty & /*imgAlt*/ 16) {
    				attr_dev(img_1, "alt", /*imgAlt*/ ctx[4]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(picture);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(60:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (58:2) {#if url}
    function create_if_block_1(ctx) {
    	let a;
    	let picture;
    	let img_1;
    	let img_1_src_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			picture = element("picture");
    			img_1 = element("img");
    			if (img_1.src !== (img_1_src_value = /*img*/ ctx[1])) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "alt", /*imgAlt*/ ctx[4]);
    			attr_dev(img_1, "class", "svelte-cbng5n");
    			add_location(img_1, file$3, 58, 29, 1074);
    			add_location(picture, file$3, 58, 19, 1064);
    			attr_dev(a, "href", /*url*/ ctx[2]);
    			attr_dev(a, "class", "svelte-cbng5n");
    			add_location(a, file$3, 58, 4, 1049);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, picture);
    			append_dev(picture, img_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*img*/ 2 && img_1.src !== (img_1_src_value = /*img*/ ctx[1])) {
    				attr_dev(img_1, "src", img_1_src_value);
    			}

    			if (dirty & /*imgAlt*/ 16) {
    				attr_dev(img_1, "alt", /*imgAlt*/ ctx[4]);
    			}

    			if (dirty & /*url*/ 4) {
    				attr_dev(a, "href", /*url*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(58:2) {#if url}",
    		ctx
    	});

    	return block;
    }

    // (62:2) {#if firstCategory}
    function create_if_block(ctx) {
    	let postpreviewcategory;
    	let current;
    	const postpreviewcategory_spread_levels = [/*firstCategory*/ ctx[3], { classes: "-on-thumb" }];
    	let postpreviewcategory_props = {};

    	for (let i = 0; i < postpreviewcategory_spread_levels.length; i += 1) {
    		postpreviewcategory_props = assign(postpreviewcategory_props, postpreviewcategory_spread_levels[i]);
    	}

    	postpreviewcategory = new PostPreviewCategory({
    			props: postpreviewcategory_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(postpreviewcategory.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(postpreviewcategory, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const postpreviewcategory_changes = (dirty & /*firstCategory*/ 8)
    			? get_spread_update(postpreviewcategory_spread_levels, [
    					get_spread_object(/*firstCategory*/ ctx[3]),
    					postpreviewcategory_spread_levels[1]
    				])
    			: {};

    			postpreviewcategory.$set(postpreviewcategory_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpreviewcategory.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpreviewcategory.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(postpreviewcategory, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(62:2) {#if firstCategory}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t;
    	let div_class_value;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*url*/ ctx[2]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*firstCategory*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", div_class_value = "post-thumb " + /*classes*/ ctx[0] + " svelte-cbng5n");
    			add_location(div, file$3, 56, 0, 996);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			}

    			if (/*firstCategory*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*firstCategory*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*classes*/ 1 && div_class_value !== (div_class_value = "post-thumb " + /*classes*/ ctx[0] + " svelte-cbng5n")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PostPreviewThumb", slots, []);
    	let { classes } = $$props;
    	let { img } = $$props;
    	let { url } = $$props;
    	let { firstCategory } = $$props;
    	let { imgAlt = "" } = $$props;
    	const writable_props = ["classes", "img", "url", "firstCategory", "imgAlt"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPreviewThumb> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("classes" in $$props) $$invalidate(0, classes = $$props.classes);
    		if ("img" in $$props) $$invalidate(1, img = $$props.img);
    		if ("url" in $$props) $$invalidate(2, url = $$props.url);
    		if ("firstCategory" in $$props) $$invalidate(3, firstCategory = $$props.firstCategory);
    		if ("imgAlt" in $$props) $$invalidate(4, imgAlt = $$props.imgAlt);
    	};

    	$$self.$capture_state = () => ({
    		PostPreviewCategory,
    		classes,
    		img,
    		url,
    		firstCategory,
    		imgAlt
    	});

    	$$self.$inject_state = $$props => {
    		if ("classes" in $$props) $$invalidate(0, classes = $$props.classes);
    		if ("img" in $$props) $$invalidate(1, img = $$props.img);
    		if ("url" in $$props) $$invalidate(2, url = $$props.url);
    		if ("firstCategory" in $$props) $$invalidate(3, firstCategory = $$props.firstCategory);
    		if ("imgAlt" in $$props) $$invalidate(4, imgAlt = $$props.imgAlt);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [classes, img, url, firstCategory, imgAlt];
    }

    class PostPreviewThumb extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			classes: 0,
    			img: 1,
    			url: 2,
    			firstCategory: 3,
    			imgAlt: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPreviewThumb",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*classes*/ ctx[0] === undefined && !("classes" in props)) {
    			console.warn("<PostPreviewThumb> was created without expected prop 'classes'");
    		}

    		if (/*img*/ ctx[1] === undefined && !("img" in props)) {
    			console.warn("<PostPreviewThumb> was created without expected prop 'img'");
    		}

    		if (/*url*/ ctx[2] === undefined && !("url" in props)) {
    			console.warn("<PostPreviewThumb> was created without expected prop 'url'");
    		}

    		if (/*firstCategory*/ ctx[3] === undefined && !("firstCategory" in props)) {
    			console.warn("<PostPreviewThumb> was created without expected prop 'firstCategory'");
    		}
    	}

    	get classes() {
    		throw new Error("<PostPreviewThumb>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<PostPreviewThumb>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get img() {
    		throw new Error("<PostPreviewThumb>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set img(value) {
    		throw new Error("<PostPreviewThumb>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<PostPreviewThumb>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<PostPreviewThumb>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get firstCategory() {
    		throw new Error("<PostPreviewThumb>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set firstCategory(value) {
    		throw new Error("<PostPreviewThumb>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get imgAlt() {
    		throw new Error("<PostPreviewThumb>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set imgAlt(value) {
    		throw new Error("<PostPreviewThumb>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\post-preview\PostPreviewAuthor.svelte generated by Svelte v3.25.1 */

    const file$4 = "src\\components\\post-preview\\PostPreviewAuthor.svelte";

    // (35:2) {#if img}
    function create_if_block$1(ctx) {
    	let picture;
    	let img_1;
    	let img_1_src_value;
    	let img_1_alt_value;

    	const block = {
    		c: function create() {
    			picture = element("picture");
    			img_1 = element("img");
    			if (img_1.src !== (img_1_src_value = /*img*/ ctx[2])) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "alt", img_1_alt_value = "Аватар " + /*name*/ ctx[0]);
    			attr_dev(img_1, "class", "svelte-129anak");
    			add_location(img_1, file$4, 34, 21, 569);
    			add_location(picture, file$4, 34, 11, 559);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, picture, anchor);
    			append_dev(picture, img_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*img*/ 4 && img_1.src !== (img_1_src_value = /*img*/ ctx[2])) {
    				attr_dev(img_1, "src", img_1_src_value);
    			}

    			if (dirty & /*name*/ 1 && img_1_alt_value !== (img_1_alt_value = "Аватар " + /*name*/ ctx[0])) {
    				attr_dev(img_1, "alt", img_1_alt_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(picture);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(35:2) {#if img}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let t0;
    	let a;
    	let t1;
    	let if_block = /*img*/ ctx[2] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			a = element("a");
    			t1 = text(/*name*/ ctx[0]);
    			attr_dev(a, "href", /*url*/ ctx[1]);
    			attr_dev(a, "class", "svelte-129anak");
    			add_location(a, file$4, 35, 2, 626);
    			attr_dev(div, "class", "entry-author svelte-129anak");
    			add_location(div, file$4, 33, 0, 520);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, a);
    			append_dev(a, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*img*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);

    			if (dirty & /*url*/ 2) {
    				attr_dev(a, "href", /*url*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PostPreviewAuthor", slots, []);
    	let { name } = $$props;
    	let { url } = $$props;
    	let { img } = $$props;
    	const writable_props = ["name", "url", "img"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPreviewAuthor> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    		if ("img" in $$props) $$invalidate(2, img = $$props.img);
    	};

    	$$self.$capture_state = () => ({ name, url, img });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    		if ("img" in $$props) $$invalidate(2, img = $$props.img);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, url, img];
    }

    class PostPreviewAuthor extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { name: 0, url: 1, img: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPreviewAuthor",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<PostPreviewAuthor> was created without expected prop 'name'");
    		}

    		if (/*url*/ ctx[1] === undefined && !("url" in props)) {
    			console.warn("<PostPreviewAuthor> was created without expected prop 'url'");
    		}

    		if (/*img*/ ctx[2] === undefined && !("img" in props)) {
    			console.warn("<PostPreviewAuthor> was created without expected prop 'img'");
    		}
    	}

    	get name() {
    		throw new Error("<PostPreviewAuthor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<PostPreviewAuthor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<PostPreviewAuthor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<PostPreviewAuthor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get img() {
    		throw new Error("<PostPreviewAuthor>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set img(value) {
    		throw new Error("<PostPreviewAuthor>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\post-preview\PostPreviewPublishedDate.svelte generated by Svelte v3.25.1 */

    const file$5 = "src\\components\\post-preview\\PostPreviewPublishedDate.svelte";

    function create_fragment$5(ctx) {
    	let time;
    	let t;

    	const block = {
    		c: function create() {
    			time = element("time");
    			t = text(/*text*/ ctx[2]);
    			attr_dev(time, "datatime", /*publishedDate*/ ctx[0]);
    			attr_dev(time, "title", /*title*/ ctx[1]);
    			attr_dev(time, "class", "svelte-nfvnsa");
    			add_location(time, file$5, 13, 0, 454);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, time, anchor);
    			append_dev(time, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 4) set_data_dev(t, /*text*/ ctx[2]);

    			if (dirty & /*publishedDate*/ 1) {
    				attr_dev(time, "datatime", /*publishedDate*/ ctx[0]);
    			}

    			if (dirty & /*title*/ 2) {
    				attr_dev(time, "title", /*title*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(time);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PostPreviewPublishedDate", slots, []);
    	let { publishedDate } = $$props;
    	const writable_props = ["publishedDate"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPreviewPublishedDate> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("publishedDate" in $$props) $$invalidate(0, publishedDate = $$props.publishedDate);
    	};

    	$$self.$capture_state = () => ({ publishedDate, title, text });

    	$$self.$inject_state = $$props => {
    		if ("publishedDate" in $$props) $$invalidate(0, publishedDate = $$props.publishedDate);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("text" in $$props) $$invalidate(2, text = $$props.text);
    	};

    	let title;
    	let text;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*publishedDate*/ 1) {
    			 $$invalidate(1, title = new Date(publishedDate).toLocaleDateString("en-US", {
    				weekday: "long",
    				year: "numeric",
    				month: "long",
    				day: "numeric",
    				hour: "2-digit",
    				minute: "2-digit"
    			}));
    		}

    		if ($$self.$$.dirty & /*publishedDate*/ 1) {
    			 $$invalidate(2, text = new Date(publishedDate).toLocaleDateString("en-US", {
    				year: "numeric",
    				month: "long",
    				day: "numeric"
    			}));
    		}
    	};

    	return [publishedDate, title, text];
    }

    class PostPreviewPublishedDate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { publishedDate: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPreviewPublishedDate",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*publishedDate*/ ctx[0] === undefined && !("publishedDate" in props)) {
    			console.warn("<PostPreviewPublishedDate> was created without expected prop 'publishedDate'");
    		}
    	}

    	get publishedDate() {
    		throw new Error("<PostPreviewPublishedDate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set publishedDate(value) {
    		throw new Error("<PostPreviewPublishedDate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\post-preview\PostPreviewPostMeta.svelte generated by Svelte v3.25.1 */
    const file$6 = "src\\components\\post-preview\\PostPreviewPostMeta.svelte";

    // (29:0) {#if author || publishedDate}
    function create_if_block$2(ctx) {
    	let ul;
    	let t;
    	let ul_class_value;
    	let current;
    	let if_block0 = /*author*/ ctx[0] && create_if_block_2(ctx);
    	let if_block1 = /*publishedDate*/ ctx[1] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(ul, "class", ul_class_value = "post-meta " + /*classes*/ ctx[2] + " svelte-1ys51oq");
    			add_location(ul, file$6, 29, 2, 575);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			if (if_block0) if_block0.m(ul, null);
    			append_dev(ul, t);
    			if (if_block1) if_block1.m(ul, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*author*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*author*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(ul, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*publishedDate*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*publishedDate*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(ul, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*classes*/ 4 && ul_class_value !== (ul_class_value = "post-meta " + /*classes*/ ctx[2] + " svelte-1ys51oq")) {
    				attr_dev(ul, "class", ul_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(29:0) {#if author || publishedDate}",
    		ctx
    	});

    	return block;
    }

    // (31:4) {#if author}
    function create_if_block_2(ctx) {
    	let li;
    	let postpreviewauthor;
    	let current;
    	const postpreviewauthor_spread_levels = [/*author*/ ctx[0]];
    	let postpreviewauthor_props = {};

    	for (let i = 0; i < postpreviewauthor_spread_levels.length; i += 1) {
    		postpreviewauthor_props = assign(postpreviewauthor_props, postpreviewauthor_spread_levels[i]);
    	}

    	postpreviewauthor = new PostPreviewAuthor({
    			props: postpreviewauthor_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(postpreviewauthor.$$.fragment);
    			attr_dev(li, "class", "svelte-1ys51oq");
    			add_location(li, file$6, 31, 6, 633);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(postpreviewauthor, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const postpreviewauthor_changes = (dirty & /*author*/ 1)
    			? get_spread_update(postpreviewauthor_spread_levels, [get_spread_object(/*author*/ ctx[0])])
    			: {};

    			postpreviewauthor.$set(postpreviewauthor_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpreviewauthor.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpreviewauthor.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(postpreviewauthor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(31:4) {#if author}",
    		ctx
    	});

    	return block;
    }

    // (36:4) {#if publishedDate}
    function create_if_block_1$1(ctx) {
    	let li;
    	let postpreviewpublisheddate;
    	let current;

    	postpreviewpublisheddate = new PostPreviewPublishedDate({
    			props: { publishedDate: /*publishedDate*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(postpreviewpublisheddate.$$.fragment);
    			attr_dev(li, "class", "svelte-1ys51oq");
    			add_location(li, file$6, 36, 6, 737);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(postpreviewpublisheddate, li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const postpreviewpublisheddate_changes = {};
    			if (dirty & /*publishedDate*/ 2) postpreviewpublisheddate_changes.publishedDate = /*publishedDate*/ ctx[1];
    			postpreviewpublisheddate.$set(postpreviewpublisheddate_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpreviewpublisheddate.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpreviewpublisheddate.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(postpreviewpublisheddate);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(36:4) {#if publishedDate}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = (/*author*/ ctx[0] || /*publishedDate*/ ctx[1]) && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*author*/ ctx[0] || /*publishedDate*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*author, publishedDate*/ 3) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
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
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PostPreviewPostMeta", slots, []);
    	let { author } = $$props;
    	let { publishedDate } = $$props;
    	let { classes } = $$props;
    	const writable_props = ["author", "publishedDate", "classes"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPreviewPostMeta> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("author" in $$props) $$invalidate(0, author = $$props.author);
    		if ("publishedDate" in $$props) $$invalidate(1, publishedDate = $$props.publishedDate);
    		if ("classes" in $$props) $$invalidate(2, classes = $$props.classes);
    	};

    	$$self.$capture_state = () => ({
    		PostPreviewAuthor,
    		PostPreviewPublishedDate,
    		author,
    		publishedDate,
    		classes
    	});

    	$$self.$inject_state = $$props => {
    		if ("author" in $$props) $$invalidate(0, author = $$props.author);
    		if ("publishedDate" in $$props) $$invalidate(1, publishedDate = $$props.publishedDate);
    		if ("classes" in $$props) $$invalidate(2, classes = $$props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [author, publishedDate, classes];
    }

    class PostPreviewPostMeta extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { author: 0, publishedDate: 1, classes: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPreviewPostMeta",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*author*/ ctx[0] === undefined && !("author" in props)) {
    			console.warn("<PostPreviewPostMeta> was created without expected prop 'author'");
    		}

    		if (/*publishedDate*/ ctx[1] === undefined && !("publishedDate" in props)) {
    			console.warn("<PostPreviewPostMeta> was created without expected prop 'publishedDate'");
    		}

    		if (/*classes*/ ctx[2] === undefined && !("classes" in props)) {
    			console.warn("<PostPreviewPostMeta> was created without expected prop 'classes'");
    		}
    	}

    	get author() {
    		throw new Error("<PostPreviewPostMeta>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set author(value) {
    		throw new Error("<PostPreviewPostMeta>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get publishedDate() {
    		throw new Error("<PostPreviewPostMeta>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set publishedDate(value) {
    		throw new Error("<PostPreviewPostMeta>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<PostPreviewPostMeta>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<PostPreviewPostMeta>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\post-preview\PostPreviewTitle.svelte generated by Svelte v3.25.1 */

    const file$7 = "src\\components\\post-preview\\PostPreviewTitle.svelte";

    // (36:36) {:else}
    function create_else_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*title*/ ctx[0]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 1) set_data_dev(t, /*title*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(36:36) {:else}",
    		ctx
    	});

    	return block;
    }

    // (36:2) {#if url}
    function create_if_block$3(ctx) {
    	let a;
    	let t;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(/*title*/ ctx[0]);
    			attr_dev(a, "href", /*url*/ ctx[1]);
    			attr_dev(a, "class", "svelte-1w4yacp");
    			add_location(a, file$7, 35, 11, 644);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 1) set_data_dev(t, /*title*/ ctx[0]);

    			if (dirty & /*url*/ 2) {
    				attr_dev(a, "href", /*url*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(36:2) {#if url}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let h3;
    	let h3_class_value;

    	function select_block_type(ctx, dirty) {
    		if (/*url*/ ctx[1]) return create_if_block$3;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			if_block.c();
    			attr_dev(h3, "class", h3_class_value = "post-title " + /*classes*/ ctx[2] + " svelte-1w4yacp");
    			add_location(h3, file$7, 34, 0, 598);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			if_block.m(h3, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(h3, null);
    				}
    			}

    			if (dirty & /*classes*/ 4 && h3_class_value !== (h3_class_value = "post-title " + /*classes*/ ctx[2] + " svelte-1w4yacp")) {
    				attr_dev(h3, "class", h3_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PostPreviewTitle", slots, []);
    	let { title } = $$props;
    	let { url } = $$props;
    	let { classes } = $$props;
    	const writable_props = ["title", "url", "classes"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPreviewTitle> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    		if ("classes" in $$props) $$invalidate(2, classes = $$props.classes);
    	};

    	$$self.$capture_state = () => ({ title, url, classes });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    		if ("classes" in $$props) $$invalidate(2, classes = $$props.classes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, url, classes];
    }

    class PostPreviewTitle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { title: 0, url: 1, classes: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPreviewTitle",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<PostPreviewTitle> was created without expected prop 'title'");
    		}

    		if (/*url*/ ctx[1] === undefined && !("url" in props)) {
    			console.warn("<PostPreviewTitle> was created without expected prop 'url'");
    		}

    		if (/*classes*/ ctx[2] === undefined && !("classes" in props)) {
    			console.warn("<PostPreviewTitle> was created without expected prop 'classes'");
    		}
    	}

    	get title() {
    		throw new Error("<PostPreviewTitle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<PostPreviewTitle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<PostPreviewTitle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<PostPreviewTitle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get classes() {
    		throw new Error("<PostPreviewTitle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<PostPreviewTitle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\post-preview\PostPreviewCard1.svelte generated by Svelte v3.25.1 */
    const file$8 = "src\\components\\post-preview\\PostPreviewCard1.svelte";

    function create_fragment$8(ctx) {
    	let article;
    	let postpreviewthumb;
    	let t0;
    	let div;
    	let postpreviewtitle;
    	let t1;
    	let postpreviewpostmeta;
    	let t2;
    	let postpreviewcategory;
    	let current;

    	postpreviewthumb = new PostPreviewThumb({
    			props: {
    				img: /*img*/ ctx[4],
    				classes: "-overlay -object-fit"
    			},
    			$$inline: true
    		});

    	postpreviewtitle = new PostPreviewTitle({
    			props: {
    				url: /*url*/ ctx[1],
    				title: /*title*/ ctx[0],
    				classes: "-absolute-link"
    			},
    			$$inline: true
    		});

    	postpreviewpostmeta = new PostPreviewPostMeta({
    			props: {
    				author: /*author*/ ctx[2],
    				publishedDate: /*publishedDate*/ ctx[3],
    				classes: ""
    			},
    			$$inline: true
    		});

    	const postpreviewcategory_spread_levels = [/*firstCategory*/ ctx[5], { classes: "-top-left" }];
    	let postpreviewcategory_props = {};

    	for (let i = 0; i < postpreviewcategory_spread_levels.length; i += 1) {
    		postpreviewcategory_props = assign(postpreviewcategory_props, postpreviewcategory_spread_levels[i]);
    	}

    	postpreviewcategory = new PostPreviewCategory({
    			props: postpreviewcategory_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			article = element("article");
    			create_component(postpreviewthumb.$$.fragment);
    			t0 = space();
    			div = element("div");
    			create_component(postpreviewtitle.$$.fragment);
    			t1 = space();
    			create_component(postpreviewpostmeta.$$.fragment);
    			t2 = space();
    			create_component(postpreviewcategory.$$.fragment);
    			attr_dev(div, "class", "post-text svelte-10k3m4b");
    			add_location(div, file$8, 66, 2, 1619);
    			attr_dev(article, "class", "post svelte-10k3m4b");
    			add_location(article, file$8, 64, 0, 1532);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			mount_component(postpreviewthumb, article, null);
    			append_dev(article, t0);
    			append_dev(article, div);
    			mount_component(postpreviewtitle, div, null);
    			append_dev(div, t1);
    			mount_component(postpreviewpostmeta, div, null);
    			append_dev(article, t2);
    			mount_component(postpreviewcategory, article, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const postpreviewthumb_changes = {};
    			if (dirty & /*img*/ 16) postpreviewthumb_changes.img = /*img*/ ctx[4];
    			postpreviewthumb.$set(postpreviewthumb_changes);
    			const postpreviewtitle_changes = {};
    			if (dirty & /*url*/ 2) postpreviewtitle_changes.url = /*url*/ ctx[1];
    			if (dirty & /*title*/ 1) postpreviewtitle_changes.title = /*title*/ ctx[0];
    			postpreviewtitle.$set(postpreviewtitle_changes);
    			const postpreviewpostmeta_changes = {};
    			if (dirty & /*author*/ 4) postpreviewpostmeta_changes.author = /*author*/ ctx[2];
    			if (dirty & /*publishedDate*/ 8) postpreviewpostmeta_changes.publishedDate = /*publishedDate*/ ctx[3];
    			postpreviewpostmeta.$set(postpreviewpostmeta_changes);

    			const postpreviewcategory_changes = (dirty & /*firstCategory*/ 32)
    			? get_spread_update(postpreviewcategory_spread_levels, [
    					get_spread_object(/*firstCategory*/ ctx[5]),
    					postpreviewcategory_spread_levels[1]
    				])
    			: {};

    			postpreviewcategory.$set(postpreviewcategory_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpreviewthumb.$$.fragment, local);
    			transition_in(postpreviewtitle.$$.fragment, local);
    			transition_in(postpreviewpostmeta.$$.fragment, local);
    			transition_in(postpreviewcategory.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpreviewthumb.$$.fragment, local);
    			transition_out(postpreviewtitle.$$.fragment, local);
    			transition_out(postpreviewpostmeta.$$.fragment, local);
    			transition_out(postpreviewcategory.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_component(postpreviewthumb);
    			destroy_component(postpreviewtitle);
    			destroy_component(postpreviewpostmeta);
    			destroy_component(postpreviewcategory);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PostPreviewCard1", slots, []);
    	let { title } = $$props;
    	let { url } = $$props;
    	let { author } = $$props;
    	let { categories } = $$props;
    	let { publishedDate } = $$props;
    	let { img } = $$props;
    	const writable_props = ["title", "url", "author", "categories", "publishedDate", "img"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPreviewCard1> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    		if ("author" in $$props) $$invalidate(2, author = $$props.author);
    		if ("categories" in $$props) $$invalidate(6, categories = $$props.categories);
    		if ("publishedDate" in $$props) $$invalidate(3, publishedDate = $$props.publishedDate);
    		if ("img" in $$props) $$invalidate(4, img = $$props.img);
    	};

    	$$self.$capture_state = () => ({
    		PostPreviewCategory,
    		PostPreviewThumb,
    		PostPreviewPostMeta,
    		PostPreviewTitle,
    		title,
    		url,
    		author,
    		categories,
    		publishedDate,
    		img,
    		firstCategory
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    		if ("author" in $$props) $$invalidate(2, author = $$props.author);
    		if ("categories" in $$props) $$invalidate(6, categories = $$props.categories);
    		if ("publishedDate" in $$props) $$invalidate(3, publishedDate = $$props.publishedDate);
    		if ("img" in $$props) $$invalidate(4, img = $$props.img);
    		if ("firstCategory" in $$props) $$invalidate(5, firstCategory = $$props.firstCategory);
    	};

    	let firstCategory;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*categories*/ 64) {
    			 $$invalidate(5, firstCategory = categories[0]);
    		}
    	};

    	return [title, url, author, publishedDate, img, firstCategory, categories];
    }

    class PostPreviewCard1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			title: 0,
    			url: 1,
    			author: 2,
    			categories: 6,
    			publishedDate: 3,
    			img: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPreviewCard1",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<PostPreviewCard1> was created without expected prop 'title'");
    		}

    		if (/*url*/ ctx[1] === undefined && !("url" in props)) {
    			console.warn("<PostPreviewCard1> was created without expected prop 'url'");
    		}

    		if (/*author*/ ctx[2] === undefined && !("author" in props)) {
    			console.warn("<PostPreviewCard1> was created without expected prop 'author'");
    		}

    		if (/*categories*/ ctx[6] === undefined && !("categories" in props)) {
    			console.warn("<PostPreviewCard1> was created without expected prop 'categories'");
    		}

    		if (/*publishedDate*/ ctx[3] === undefined && !("publishedDate" in props)) {
    			console.warn("<PostPreviewCard1> was created without expected prop 'publishedDate'");
    		}

    		if (/*img*/ ctx[4] === undefined && !("img" in props)) {
    			console.warn("<PostPreviewCard1> was created without expected prop 'img'");
    		}
    	}

    	get title() {
    		throw new Error("<PostPreviewCard1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<PostPreviewCard1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<PostPreviewCard1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<PostPreviewCard1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get author() {
    		throw new Error("<PostPreviewCard1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set author(value) {
    		throw new Error("<PostPreviewCard1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get categories() {
    		throw new Error("<PostPreviewCard1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set categories(value) {
    		throw new Error("<PostPreviewCard1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get publishedDate() {
    		throw new Error("<PostPreviewCard1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set publishedDate(value) {
    		throw new Error("<PostPreviewCard1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get img() {
    		throw new Error("<PostPreviewCard1>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set img(value) {
    		throw new Error("<PostPreviewCard1>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\post-preview\PostPreviewExcerpt.svelte generated by Svelte v3.25.1 */

    const file$9 = "src\\components\\post-preview\\PostPreviewExcerpt.svelte";

    function create_fragment$9(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*description*/ ctx[0]);
    			attr_dev(p, "class", "post-excerpt svelte-4b3shf");
    			add_location(p, file$9, 12, 0, 179);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*description*/ 1) set_data_dev(t, /*description*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PostPreviewExcerpt", slots, []);
    	let { description } = $$props;
    	const writable_props = ["description"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPreviewExcerpt> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("description" in $$props) $$invalidate(0, description = $$props.description);
    	};

    	$$self.$capture_state = () => ({ description });

    	$$self.$inject_state = $$props => {
    		if ("description" in $$props) $$invalidate(0, description = $$props.description);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [description];
    }

    class PostPreviewExcerpt extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { description: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPreviewExcerpt",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*description*/ ctx[0] === undefined && !("description" in props)) {
    			console.warn("<PostPreviewExcerpt> was created without expected prop 'description'");
    		}
    	}

    	get description() {
    		throw new Error("<PostPreviewExcerpt>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<PostPreviewExcerpt>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\post-preview\PostPreviewCard2.svelte generated by Svelte v3.25.1 */
    const file$a = "src\\components\\post-preview\\PostPreviewCard2.svelte";

    function create_fragment$a(ctx) {
    	let article;
    	let postpreviewthumb;
    	let t0;
    	let div;
    	let postpreviewtitle;
    	let t1;
    	let postpreviewexcerpt;
    	let t2;
    	let postpreviewpostmeta;
    	let current;

    	postpreviewthumb = new PostPreviewThumb({
    			props: {
    				img: /*img*/ ctx[5],
    				url: /*url*/ ctx[2],
    				firstCategory: /*firstCategory*/ ctx[6],
    				classes: "-object-fit"
    			},
    			$$inline: true
    		});

    	postpreviewtitle = new PostPreviewTitle({
    			props: {
    				url: /*url*/ ctx[2],
    				title: /*title*/ ctx[0],
    				classes: ""
    			},
    			$$inline: true
    		});

    	postpreviewexcerpt = new PostPreviewExcerpt({
    			props: { description: /*description*/ ctx[1] },
    			$$inline: true
    		});

    	postpreviewpostmeta = new PostPreviewPostMeta({
    			props: {
    				author: /*author*/ ctx[3],
    				publishedDate: /*publishedDate*/ ctx[4],
    				classes: ""
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			article = element("article");
    			create_component(postpreviewthumb.$$.fragment);
    			t0 = space();
    			div = element("div");
    			create_component(postpreviewtitle.$$.fragment);
    			t1 = space();
    			create_component(postpreviewexcerpt.$$.fragment);
    			t2 = space();
    			create_component(postpreviewpostmeta.$$.fragment);
    			attr_dev(div, "class", "post-text svelte-p7a7iu");
    			add_location(div, file$a, 25, 2, 641);
    			attr_dev(article, "class", "post");
    			add_location(article, file$a, 23, 0, 541);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			mount_component(postpreviewthumb, article, null);
    			append_dev(article, t0);
    			append_dev(article, div);
    			mount_component(postpreviewtitle, div, null);
    			append_dev(div, t1);
    			mount_component(postpreviewexcerpt, div, null);
    			append_dev(div, t2);
    			mount_component(postpreviewpostmeta, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const postpreviewthumb_changes = {};
    			if (dirty & /*img*/ 32) postpreviewthumb_changes.img = /*img*/ ctx[5];
    			if (dirty & /*url*/ 4) postpreviewthumb_changes.url = /*url*/ ctx[2];
    			if (dirty & /*firstCategory*/ 64) postpreviewthumb_changes.firstCategory = /*firstCategory*/ ctx[6];
    			postpreviewthumb.$set(postpreviewthumb_changes);
    			const postpreviewtitle_changes = {};
    			if (dirty & /*url*/ 4) postpreviewtitle_changes.url = /*url*/ ctx[2];
    			if (dirty & /*title*/ 1) postpreviewtitle_changes.title = /*title*/ ctx[0];
    			postpreviewtitle.$set(postpreviewtitle_changes);
    			const postpreviewexcerpt_changes = {};
    			if (dirty & /*description*/ 2) postpreviewexcerpt_changes.description = /*description*/ ctx[1];
    			postpreviewexcerpt.$set(postpreviewexcerpt_changes);
    			const postpreviewpostmeta_changes = {};
    			if (dirty & /*author*/ 8) postpreviewpostmeta_changes.author = /*author*/ ctx[3];
    			if (dirty & /*publishedDate*/ 16) postpreviewpostmeta_changes.publishedDate = /*publishedDate*/ ctx[4];
    			postpreviewpostmeta.$set(postpreviewpostmeta_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpreviewthumb.$$.fragment, local);
    			transition_in(postpreviewtitle.$$.fragment, local);
    			transition_in(postpreviewexcerpt.$$.fragment, local);
    			transition_in(postpreviewpostmeta.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpreviewthumb.$$.fragment, local);
    			transition_out(postpreviewtitle.$$.fragment, local);
    			transition_out(postpreviewexcerpt.$$.fragment, local);
    			transition_out(postpreviewpostmeta.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_component(postpreviewthumb);
    			destroy_component(postpreviewtitle);
    			destroy_component(postpreviewexcerpt);
    			destroy_component(postpreviewpostmeta);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PostPreviewCard2", slots, []);
    	let { title } = $$props;
    	let { description } = $$props;
    	let { url } = $$props;
    	let { author } = $$props;
    	let { categories } = $$props;
    	let { publishedDate } = $$props;
    	let { img } = $$props;
    	const writable_props = ["title", "description", "url", "author", "categories", "publishedDate", "img"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPreviewCard2> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("description" in $$props) $$invalidate(1, description = $$props.description);
    		if ("url" in $$props) $$invalidate(2, url = $$props.url);
    		if ("author" in $$props) $$invalidate(3, author = $$props.author);
    		if ("categories" in $$props) $$invalidate(7, categories = $$props.categories);
    		if ("publishedDate" in $$props) $$invalidate(4, publishedDate = $$props.publishedDate);
    		if ("img" in $$props) $$invalidate(5, img = $$props.img);
    	};

    	$$self.$capture_state = () => ({
    		PostPreviewThumb,
    		PostPreviewPostMeta,
    		PostPreviewTitle,
    		PostPreviewExcerpt,
    		title,
    		description,
    		url,
    		author,
    		categories,
    		publishedDate,
    		img,
    		firstCategory
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("description" in $$props) $$invalidate(1, description = $$props.description);
    		if ("url" in $$props) $$invalidate(2, url = $$props.url);
    		if ("author" in $$props) $$invalidate(3, author = $$props.author);
    		if ("categories" in $$props) $$invalidate(7, categories = $$props.categories);
    		if ("publishedDate" in $$props) $$invalidate(4, publishedDate = $$props.publishedDate);
    		if ("img" in $$props) $$invalidate(5, img = $$props.img);
    		if ("firstCategory" in $$props) $$invalidate(6, firstCategory = $$props.firstCategory);
    	};

    	let firstCategory;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*categories*/ 128) {
    			 $$invalidate(6, firstCategory = categories[0]);
    		}
    	};

    	return [title, description, url, author, publishedDate, img, firstCategory, categories];
    }

    class PostPreviewCard2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			title: 0,
    			description: 1,
    			url: 2,
    			author: 3,
    			categories: 7,
    			publishedDate: 4,
    			img: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPreviewCard2",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<PostPreviewCard2> was created without expected prop 'title'");
    		}

    		if (/*description*/ ctx[1] === undefined && !("description" in props)) {
    			console.warn("<PostPreviewCard2> was created without expected prop 'description'");
    		}

    		if (/*url*/ ctx[2] === undefined && !("url" in props)) {
    			console.warn("<PostPreviewCard2> was created without expected prop 'url'");
    		}

    		if (/*author*/ ctx[3] === undefined && !("author" in props)) {
    			console.warn("<PostPreviewCard2> was created without expected prop 'author'");
    		}

    		if (/*categories*/ ctx[7] === undefined && !("categories" in props)) {
    			console.warn("<PostPreviewCard2> was created without expected prop 'categories'");
    		}

    		if (/*publishedDate*/ ctx[4] === undefined && !("publishedDate" in props)) {
    			console.warn("<PostPreviewCard2> was created without expected prop 'publishedDate'");
    		}

    		if (/*img*/ ctx[5] === undefined && !("img" in props)) {
    			console.warn("<PostPreviewCard2> was created without expected prop 'img'");
    		}
    	}

    	get title() {
    		throw new Error("<PostPreviewCard2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<PostPreviewCard2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<PostPreviewCard2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<PostPreviewCard2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<PostPreviewCard2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<PostPreviewCard2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get author() {
    		throw new Error("<PostPreviewCard2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set author(value) {
    		throw new Error("<PostPreviewCard2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get categories() {
    		throw new Error("<PostPreviewCard2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set categories(value) {
    		throw new Error("<PostPreviewCard2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get publishedDate() {
    		throw new Error("<PostPreviewCard2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set publishedDate(value) {
    		throw new Error("<PostPreviewCard2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get img() {
    		throw new Error("<PostPreviewCard2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set img(value) {
    		throw new Error("<PostPreviewCard2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\post-preview\PostPreviewCard3.svelte generated by Svelte v3.25.1 */
    const file$b = "src\\components\\post-preview\\PostPreviewCard3.svelte";

    function create_fragment$b(ctx) {
    	let article;
    	let postpreviewthumb;
    	let t0;
    	let div;
    	let postpreviewtitle;
    	let t1;
    	let postpreviewpostmeta;
    	let current;

    	postpreviewthumb = new PostPreviewThumb({
    			props: {
    				img: /*img*/ ctx[3],
    				url: /*url*/ ctx[1],
    				classes: "-object-fit"
    			},
    			$$inline: true
    		});

    	postpreviewtitle = new PostPreviewTitle({
    			props: {
    				url: /*url*/ ctx[1],
    				title: /*title*/ ctx[0],
    				classes: ""
    			},
    			$$inline: true
    		});

    	postpreviewpostmeta = new PostPreviewPostMeta({
    			props: {
    				publishedDate: /*publishedDate*/ ctx[2],
    				classes: ""
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			article = element("article");
    			create_component(postpreviewthumb.$$.fragment);
    			t0 = space();
    			div = element("div");
    			create_component(postpreviewtitle.$$.fragment);
    			t1 = space();
    			create_component(postpreviewpostmeta.$$.fragment);
    			attr_dev(div, "class", "post-text svelte-1arhsmx");
    			add_location(div, file$b, 34, 2, 761);
    			attr_dev(article, "class", "post svelte-1arhsmx");
    			add_location(article, file$b, 32, 0, 677);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			mount_component(postpreviewthumb, article, null);
    			append_dev(article, t0);
    			append_dev(article, div);
    			mount_component(postpreviewtitle, div, null);
    			append_dev(div, t1);
    			mount_component(postpreviewpostmeta, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const postpreviewthumb_changes = {};
    			if (dirty & /*img*/ 8) postpreviewthumb_changes.img = /*img*/ ctx[3];
    			if (dirty & /*url*/ 2) postpreviewthumb_changes.url = /*url*/ ctx[1];
    			postpreviewthumb.$set(postpreviewthumb_changes);
    			const postpreviewtitle_changes = {};
    			if (dirty & /*url*/ 2) postpreviewtitle_changes.url = /*url*/ ctx[1];
    			if (dirty & /*title*/ 1) postpreviewtitle_changes.title = /*title*/ ctx[0];
    			postpreviewtitle.$set(postpreviewtitle_changes);
    			const postpreviewpostmeta_changes = {};
    			if (dirty & /*publishedDate*/ 4) postpreviewpostmeta_changes.publishedDate = /*publishedDate*/ ctx[2];
    			postpreviewpostmeta.$set(postpreviewpostmeta_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpreviewthumb.$$.fragment, local);
    			transition_in(postpreviewtitle.$$.fragment, local);
    			transition_in(postpreviewpostmeta.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpreviewthumb.$$.fragment, local);
    			transition_out(postpreviewtitle.$$.fragment, local);
    			transition_out(postpreviewpostmeta.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_component(postpreviewthumb);
    			destroy_component(postpreviewtitle);
    			destroy_component(postpreviewpostmeta);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PostPreviewCard3", slots, []);
    	let { title } = $$props;
    	let { url } = $$props;
    	let { publishedDate } = $$props;
    	let { img } = $$props;
    	const writable_props = ["title", "url", "publishedDate", "img"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<PostPreviewCard3> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    		if ("publishedDate" in $$props) $$invalidate(2, publishedDate = $$props.publishedDate);
    		if ("img" in $$props) $$invalidate(3, img = $$props.img);
    	};

    	$$self.$capture_state = () => ({
    		PostPreviewThumb,
    		PostPreviewPostMeta,
    		PostPreviewTitle,
    		title,
    		url,
    		publishedDate,
    		img
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("url" in $$props) $$invalidate(1, url = $$props.url);
    		if ("publishedDate" in $$props) $$invalidate(2, publishedDate = $$props.publishedDate);
    		if ("img" in $$props) $$invalidate(3, img = $$props.img);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, url, publishedDate, img];
    }

    class PostPreviewCard3 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
    			title: 0,
    			url: 1,
    			publishedDate: 2,
    			img: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PostPreviewCard3",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[0] === undefined && !("title" in props)) {
    			console.warn("<PostPreviewCard3> was created without expected prop 'title'");
    		}

    		if (/*url*/ ctx[1] === undefined && !("url" in props)) {
    			console.warn("<PostPreviewCard3> was created without expected prop 'url'");
    		}

    		if (/*publishedDate*/ ctx[2] === undefined && !("publishedDate" in props)) {
    			console.warn("<PostPreviewCard3> was created without expected prop 'publishedDate'");
    		}

    		if (/*img*/ ctx[3] === undefined && !("img" in props)) {
    			console.warn("<PostPreviewCard3> was created without expected prop 'img'");
    		}
    	}

    	get title() {
    		throw new Error("<PostPreviewCard3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<PostPreviewCard3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get url() {
    		throw new Error("<PostPreviewCard3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<PostPreviewCard3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get publishedDate() {
    		throw new Error("<PostPreviewCard3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set publishedDate(value) {
    		throw new Error("<PostPreviewCard3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get img() {
    		throw new Error("<PostPreviewCard3>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set img(value) {
    		throw new Error("<PostPreviewCard3>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.25.1 */
    const file$c = "src\\App.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (151:4) {#each posts as post}
    function create_each_block_2(ctx) {
    	let postpreviewcard1;
    	let current;
    	const postpreviewcard1_spread_levels = [/*post*/ ctx[2]];
    	let postpreviewcard1_props = {};

    	for (let i = 0; i < postpreviewcard1_spread_levels.length; i += 1) {
    		postpreviewcard1_props = assign(postpreviewcard1_props, postpreviewcard1_spread_levels[i]);
    	}

    	postpreviewcard1 = new PostPreviewCard1({
    			props: postpreviewcard1_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(postpreviewcard1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(postpreviewcard1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const postpreviewcard1_changes = (dirty & /*posts*/ 2)
    			? get_spread_update(postpreviewcard1_spread_levels, [get_spread_object(/*post*/ ctx[2])])
    			: {};

    			postpreviewcard1.$set(postpreviewcard1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpreviewcard1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpreviewcard1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(postpreviewcard1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(151:4) {#each posts as post}",
    		ctx
    	});

    	return block;
    }

    // (156:4) {#each posts as post}
    function create_each_block_1(ctx) {
    	let postpreviewcard2;
    	let current;
    	const postpreviewcard2_spread_levels = [/*post*/ ctx[2]];
    	let postpreviewcard2_props = {};

    	for (let i = 0; i < postpreviewcard2_spread_levels.length; i += 1) {
    		postpreviewcard2_props = assign(postpreviewcard2_props, postpreviewcard2_spread_levels[i]);
    	}

    	postpreviewcard2 = new PostPreviewCard2({
    			props: postpreviewcard2_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(postpreviewcard2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(postpreviewcard2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const postpreviewcard2_changes = (dirty & /*posts*/ 2)
    			? get_spread_update(postpreviewcard2_spread_levels, [get_spread_object(/*post*/ ctx[2])])
    			: {};

    			postpreviewcard2.$set(postpreviewcard2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpreviewcard2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpreviewcard2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(postpreviewcard2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(156:4) {#each posts as post}",
    		ctx
    	});

    	return block;
    }

    // (161:4) {#each posts as post}
    function create_each_block$1(ctx) {
    	let postpreviewcard3;
    	let current;
    	const postpreviewcard3_spread_levels = [/*post*/ ctx[2]];
    	let postpreviewcard3_props = {};

    	for (let i = 0; i < postpreviewcard3_spread_levels.length; i += 1) {
    		postpreviewcard3_props = assign(postpreviewcard3_props, postpreviewcard3_spread_levels[i]);
    	}

    	postpreviewcard3 = new PostPreviewCard3({
    			props: postpreviewcard3_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(postpreviewcard3.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(postpreviewcard3, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const postpreviewcard3_changes = (dirty & /*posts*/ 2)
    			? get_spread_update(postpreviewcard3_spread_levels, [get_spread_object(/*post*/ ctx[2])])
    			: {};

    			postpreviewcard3.$set(postpreviewcard3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(postpreviewcard3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(postpreviewcard3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(postpreviewcard3, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(161:4) {#each posts as post}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let siteheader;
    	let t0;
    	let main;
    	let h1;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let p;
    	let t5;
    	let a;
    	let t7;
    	let t8;
    	let section0;
    	let t9;
    	let section1;
    	let t10;
    	let section2;
    	let current;
    	siteheader = new SiteHeader({ $$inline: true });
    	let each_value_2 = /*posts*/ ctx[1];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks_2[i], 1, 1, () => {
    		each_blocks_2[i] = null;
    	});

    	let each_value_1 = /*posts*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out_1 = i => transition_out(each_blocks_1[i], 1, 1, () => {
    		each_blocks_1[i] = null;
    	});

    	let each_value = /*posts*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out_2 = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			create_component(siteheader.$$.fragment);
    			t0 = space();
    			main = element("main");
    			h1 = element("h1");
    			t1 = text("Hello ");
    			t2 = text(/*name*/ ctx[0]);
    			t3 = text("!");
    			t4 = space();
    			p = element("p");
    			t5 = text("Visit the ");
    			a = element("a");
    			a.textContent = "Svelte tutorial";
    			t7 = text(" to learn\n    how to build Svelte apps.");
    			t8 = space();
    			section0 = element("section");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t9 = space();
    			section1 = element("section");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t10 = space();
    			section2 = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "svelte-dnd40");
    			add_location(h1, file$c, 143, 2, 3969);
    			attr_dev(a, "href", "https://svelte.dev/tutorial");
    			add_location(a, file$c, 145, 14, 4012);
    			add_location(p, file$c, 144, 2, 3994);
    			attr_dev(section0, "class", "posts-1 -mosaic svelte-dnd40");
    			add_location(section0, file$c, 149, 2, 4119);
    			attr_dev(section1, "class", "posts-2 svelte-dnd40");
    			add_location(section1, file$c, 154, 2, 4243);
    			attr_dev(section2, "class", "posts-3");
    			add_location(section2, file$c, 159, 2, 4359);
    			attr_dev(main, "class", "svelte-dnd40");
    			add_location(main, file$c, 142, 0, 3960);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(siteheader, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(h1, t3);
    			append_dev(main, t4);
    			append_dev(main, p);
    			append_dev(p, t5);
    			append_dev(p, a);
    			append_dev(p, t7);
    			append_dev(main, t8);
    			append_dev(main, section0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(section0, null);
    			}

    			append_dev(main, t9);
    			append_dev(main, section1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(section1, null);
    			}

    			append_dev(main, t10);
    			append_dev(main, section2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*name*/ 1) set_data_dev(t2, /*name*/ ctx[0]);

    			if (dirty & /*posts*/ 2) {
    				each_value_2 = /*posts*/ ctx[1];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    						transition_in(each_blocks_2[i], 1);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						transition_in(each_blocks_2[i], 1);
    						each_blocks_2[i].m(section0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks_2.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*posts*/ 2) {
    				each_value_1 = /*posts*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    						transition_in(each_blocks_1[i], 1);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						transition_in(each_blocks_1[i], 1);
    						each_blocks_1[i].m(section1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
    					out_1(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*posts*/ 2) {
    				each_value = /*posts*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(section2, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out_2(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(siteheader.$$.fragment, local);

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks_2[i]);
    			}

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks_1[i]);
    			}

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(siteheader.$$.fragment, local);
    			each_blocks_2 = each_blocks_2.filter(Boolean);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				transition_out(each_blocks_2[i]);
    			}

    			each_blocks_1 = each_blocks_1.filter(Boolean);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				transition_out(each_blocks_1[i]);
    			}

    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(siteheader, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { name } = $$props;

    	let posts = [
    		{
    			title: "The Joy of Petty Grievances in Death Becomes Her",
    			description: "Whoever said “It’s not about the destination. It’s the journey” never flew on a long haul flight. Those flights can be painful, tiresome, ...",
    			url: "/post-url",
    			author: { name: "bkninja", url: "/author" },
    			categories: [
    				{ name: "Fashion", url: "/fashion" },
    				{ name: "Technology", url: "/technology" }
    			],
    			publishedDate: "2019-10-18T08:37:03+00:00",
    			img: "https://atbs.bk-ninja.com/ceris/wp-content/uploads/2020/04/ceris_12-400x300.jpg"
    		},
    		{
    			title: "The Joy of Petty Grievances in Death Becomes Her1",
    			description: "Whoever said “It’s not about the destination. It’s the journey” never flew on a long haul flight. Those flights can be painful, tiresome, ...",
    			url: "/post-url",
    			author: {
    				name: "bkninja",
    				url: "/author",
    				img: "https://secure.gravatar.com/avatar/662a272c8be177be19f47db7acac0cb9?s=50&d=mm&r=g"
    			},
    			categories: [
    				{ name: "Fashion", url: "/fashion" },
    				{ name: "Technology", url: "/technology" }
    			],
    			publishedDate: "2019-10-18T08:37:03+00:00",
    			img: "https://atbs.bk-ninja.com/ceris/wp-content/uploads/2020/04/ceris_12-400x300.jpg"
    		},
    		{
    			title: "The Joy of Petty Grievances in Death Becomes Her2",
    			description: "Whoever said “It’s not about the destination. It’s the journey” never flew on a long haul flight. Those flights can be painful, tiresome, ...",
    			url: "/post-url",
    			author: {
    				name: "bkninja",
    				url: "/author",
    				img: "https://secure.gravatar.com/avatar/662a272c8be177be19f47db7acac0cb9?s=50&d=mm&r=g"
    			},
    			categories: [
    				{ name: "Fashion", url: "/fashion" },
    				{ name: "Technology", url: "/technology" }
    			],
    			publishedDate: "2019-10-18T08:37:03+00:00",
    			img: "https://atbs.bk-ninja.com/ceris/wp-content/uploads/2020/04/ceris_12-400x300.jpg"
    		},
    		{
    			title: "The Joy of Petty Grievances in Death Becomes Her3",
    			description: "Whoever said “It’s not about the destination. It’s the journey” never flew on a long haul flight. Those flights can be painful, tiresome, ...",
    			url: "/post-url",
    			author: {
    				name: "bkninja",
    				url: "/author",
    				img: "https://secure.gravatar.com/avatar/662a272c8be177be19f47db7acac0cb9?s=50&d=mm&r=g"
    			},
    			categories: [
    				{ name: "Fashion", url: "/fashion" },
    				{ name: "Technology", url: "/technology" }
    			],
    			publishedDate: "2019-10-18T08:37:03+00:00",
    			img: "https://atbs.bk-ninja.com/ceris/wp-content/uploads/2020/04/ceris_12-400x300.jpg"
    		}
    	];

    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		SiteHeader,
    		PostPreviewCard1,
    		PostPreviewCard2,
    		PostPreviewCard3,
    		name,
    		posts
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("posts" in $$props) $$invalidate(1, posts = $$props.posts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, posts];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<App> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
