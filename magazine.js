// One more assertion and I use Interrupt. (Currently, two.)
const assert = require('assert')

const Keyify = require('keyify')

const NULL = Symbol('null')

class Magazine {
    static Map = class {
        constructor (cache) {
            this.cache = cache
        }

        _get (key, vargs) {
            let got
            if (vargs.length == 0) {
                const cartridge = this.cache.hold(key)
                if (cartridge == null) {
                    return got
                }
                got = cartridge.value
                cartridge.release()
            } else {
                const cartridge = this.cache.hold.apply(this.cache, [ key ].concat(vargs))
                got = cartridge.value
                cartridge.release()
            }
            return got
        }

        _put (key, value, vargs) {
            let got
            const cartridge = this.cache.hold(key, NULL)
            if (cartridge.value !== NULL) {
                got = cartridge.value
            }
            cartridge.value = value
            if (vargs.length == 1) {
                cartridge.heft = vargs[0]
            }
            cartridge.release()
            return got
        }

        get (key, ...vargs) {
            return this._get(key, vargs)
        }

        put (key, value, ...vargs) {
            return this._put(key, value, vargs)
        }

        remove (key) {
            let got
            const cartridge = this.cache.hold(key, NULL)
            if (cartridge.value !== NULL) {
                got = cartridge.value
            }
            cartridge.remove()
            return got
        }
    }

    static Content = class extends Magazine.Map {
        constructor () {
            super()
        }

        expire (timeout = this.timeout) {
            const expired = Date.now() - timeout
            this.cache.expire(({ value }) => value.when < expired)
        }

        _heft (index) {
            if (vargs.length < index + 1) {
                if ('length' in vargs[1]) {
                    vargs.push(vargs[1].length)
                } else if ('byteLength' in vargs[1]) {
                    vargs.push(vargs[1].byteLength)
                }
            }
        }

        _value (value) {
            return value == null ? null : value.value
        }

        get (key, ...vargs) {
            this.expire()
            if (vargs.length != 0) {
                vargs[0] = { value: vargs[0], when: Date.now() }
                this._heft(1, vargs)
            }
            return this._value(this._get(key, vargs))
        }

        put (key, value, ...vargs) {
            value = { value, when: Date.now() }
            this._heft(0, vargs)
            return this._value(this._put(key, value, vargs))
        }

        remove (key) {
            return this._value(super.remove(key))
        }
    }

    static OpenClose = class {
        static _MISSING = Symbol('MISSING')

        static _PRESENT = Symbol('PRESENT')

        constructor (magazine, options) {
            this.magazine = magazine
            this._map = new WeakMap
            this._options = options
        }

        subordinate () {
            return this._subordinate((magazine, options) => new Magazine.OpenClose(magazine, options))
        }

        _subordinate (constructor) {
            const openClose = constructor(this.magazine.magazine(), this._options)
            assert(openClose instanceof Magazine.OpenClose)
            openClose._map = this._map
            return openClose
        }

        // If your open function raises an exception no entry will be added to
        // the cache and the exception will be propagated to the function that
        // called `get`. You should be sure to do any cleanup in your `open`
        // function. There will be no way for the `OpenClose` class to call
        // close for you.

        //
        async get (key, ...vargs) {
            for (;;) {
                const cartridge = this.magazine.hold(key, Magazine.OpenClose._MISSING)
                if (cartridge.value == Magazine.OpenClose._MISSING) {
                    cartridge.value = Magazine.OpenClose._PRESENT
                    let capture
                    const meta = {
                        promise: new Promise(resolve => capture = { resolve }),
                        handle: null,
                        valid: true
                    }
                    this._map.set(cartridge, meta)
                    try {
                        cartridge.value = await this.open.apply(this, [ key ].concat(vargs))
                    } catch (error) {
                        cartridge.remove()
                        throw error
                    } finally {
                        meta.promise = null
                        capture.resolve.call(null)
                    }
                    return cartridge
                } else {
                    const meta = this._map.get(cartridge)
                    if (meta.promise != null) {
                        cartridge.release()
                        await meta.promise
                    } else {
                        if (!meta.valid) {
                            cartridge.release()
                            throw new Error('invalid handle')
                        }
                        return cartridge
                    }
                }
            }
        }
        //

        // If your close function raises an exception we do not remove the entry
        // from the cache, we mark it as invalid and we will raise exceptions
        // until, hopefully, your evil program is destroyed.

        // An excpetion from `close` will be propagated to the function that
        // called `shrink` so it will unwind the stack, but if you handle the
        // exception outside of `close` the cache is going to become unusable.

        // This is fine.

        //
        async shrink (size) {
            while (this.magazine.size > size) {
                const cartridge = this.magazine.least()
                if (cartridge == null) {
                    break
                }
                const meta = this._map.get(cartridge)
                meta.valid = false
                let capture
                meta.promise = new Promise(resolve => capture = { resolve })
                try {
                    await this.close(cartridge.value, cartridge.key)
                    cartridge.remove()
                } catch (error) {
                    cartridge.release()
                    throw error
                } finally {
                    meta.promise = null
                    capture.resolve.call(null)
                }
            }
        }

        errored () {
            const cartridge = this.magazine.least()
            if (cartridge == null) {
                return null
            }
            if (cartridge.valid) {
                cartridge.release()
                return null
            }
            return cartridge
        }

        async open (...vargs) {
            return this._options.open.apply(null, vargs)
        }

        async close (handle, key) {
            return this._options.close.call(null, handle, key)
        }
    }

    constructor (parent = null) {
        const path = [ this ]
        let iterator = parent
        this._key = []
        this._instance = 0
        while (iterator != null) {
            this._key = [ iterator._instance++ ]
            path.push(iterator)
            iterator = iterator.parent
        }
        this._index = path.length - 1
        this._path = path.reverse()
        this.parent = parent
        this.size = 0
        this._head = new Cartridge(this, null, [], null)
        this._heft = 0
        this._cache = parent != null ? parent._cache : {}
    }

    get heft () {
        return this._heft
    }

    magazine () {
        return new Magazine(this)
    }

    cache () {
        return this.magazine(key)
    }

    hold (key, ...vargs) {
        const qualified = [ this._key, key ]
        const keyified = Keyify.stringify(qualified)
        let cartridge = this._cache[keyified]
        if (cartridge == null) {
            if (vargs.length == 0) {
                return null
            }
            this._cache[keyified] = cartridge = new Cartridge(this, keyified, key, vargs[0])
            cartridge._link()
            if (vargs.length == 2) {
                cartridge.heft = vargs[1]
            }
        } else {
            cartridge._unlink()
            cartridge._link()
        }
        cartridge._references++
        return cartridge
    }

    purge (heft) {
        this._evict(() => this._heft > heft)
    }

    shrink (size) {
        this._evict(() => this.size > size)
    }

    evict (evict) {
        this._evict(entry => evict({ cache: this, value: entry.value, heft: entry.heft }))
    }

    _evict (evict) {
        let iterator = this._head._links[this._index].previous
        while (
            iterator.cartridge != null &&
            iterator.cartridge._references == 0 &&
            evict(iterator.cartridge)
        ) {
            iterator.cartridge._unlink()
            delete this._cache[iterator.cartridge._keyified]
            iterator = iterator.previous
        }
    }

    *[Symbol.iterator] () {
        let iterator = this._head._links[this._index].previous
        while (iterator.cartridge != null && iterator.cartridge._references == 0) {
            const cartridge = iterator.cartridge
            iterator = iterator.previous
            cartridge._references++
            yield cartridge
        }
    }

    least () {
        const previous = this._head._links[this._index].previous
        if (previous.cartridge == null || previous.cartridge._references != 0) {
            return null
        }
        previous.cartridge._references++
        return previous.cartridge
    }

    every (f) {
        let iterator = this._head._links[this._index].previous
        while (iterator.cartridge != null) {
            if (!f(iterator.cartridge.value)) {
                return false
            }
            iterator = iterator.next
        }
        return true
    }

    reduce (f, value) {
        let iterator = this._head._links[this._index].previous
        while (iterator.cartridge != null) {
            value = f(value, iterator.cartridge.value)
        }
        return value
    }
}

class Cartridge {
    constructor (magazine, keyified, key, value) {
        this.magazine = magazine
        this._keyified = keyified
        this.key = key
        this.value = value
        this._references = 0
        this._links = []
        this._heft = 0
        for (let i = 0; i < magazine._path.length; i++) {
            const node = { previous: null, next: null, cartridge: null }
            this._links[i] = node.previous = node.next = node
        }
    }

    set heft (value) {
        for (const magazine of this.magazine._path) {
            magazine._heft -= this._heft
        }
        this._heft = value
        for (const magazine of this.magazine._path) {
            magazine._heft += this._heft
        }
    }

    get heft () {
        return this._heft
    }

    _link () {
        for (let i = 0, I = this._links.length; i < I; i++) {
            const magazine = this.magazine._path[i]
            const node = this._links[i]
            node.cartridge = this
            node.next = magazine._head._links[i].next
            node.previous = magazine._head._links[i]
            node.next.previous = node
            node.previous.next = node
            magazine.size++
            magazine._heft += this._heft
        }
    }

    _unlink () {
        for (let i = 0, I = this._links.length; i < I; i++) {
            this._links[i].previous.next = this._links[i].next
            this._links[i].next.previous = this._links[i].previous
            const magazine = this.magazine._path[i]
            magazine.size--
            magazine._heft -= this._heft
        }
    }

    remove () {
        assert(this._references == 1, 'multiple references at delete')
        this._unlink()
        delete this.magazine._cache[this._keyified]
    }

    release () {
        this._references--
    }
}

module.exports = Magazine
