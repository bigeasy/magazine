const assert = require('assert')

const Keyify = require('keyify')

const NULL = Symbol('null')

class Magazine {
    static Map = class {
        constructor (cache) {
            this.cache = cache
        }

        get (key, ...vargs) {
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

        put (key, value) {
            let got
            const cartridge = this.cache.hold(key, NULL)
            if (cartridge.value !== NULL) {
                got = cartridge.value
            }
            cartridge.value = value
            cartridge.release()
            return got
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

    constructor (parent = null, key = []) {
        const path = [ this ]
        let iterator = parent
        while (iterator != null) {
            path.push(iterator)
            iterator = iterator.parent
        }
        this._index = path.length - 1
        this._path = path.reverse()
        this.parent = parent
        this._key = key
        this._instance = 0
        this.count = 0
        this._head = new Cartridge(this, null, [], null)
        this._heft = 0
        this._cache = parent != null ? parent._cache : {}
    }

    get heft () {
        return this._heft
    }

    magazine (key) {
        return new Magazine(this, this._key.concat(key))
    }

    cache (key) {
        this.magazine(key)
    }

    hold (key, ...vargs) {
        const qualified = this._key.concat(key)
        const keyified = Keyify.stringify(qualified)
        let cartridge = this._cache[keyified]
        if (cartridge == null) {
            if (vargs.length == 0) {
                return null
            }
            this._cache[keyified] = cartridge = new Cartridge(this, keyified, qualified, vargs[0])
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
        let iterator = this._head._links[this._index].previous
        while (iterator.cartridge != null && iterator.cartridge._references == 0 && this._heft > heft) {
            iterator.cartridge._unlink()
            delete this._cache[iterator.cartridge._keyified]
            iterator = iterator.previous
        }
    }

    shrink (count) {
        let iterator = this._head._links[this._index].previous
        while (iterator.cartridge != null && iterator.cartridge._references == 0 && this.count > count) {
            iterator.cartridge._unlink()
            delete this._cache[iterator.cartridge._keyified]
            iterator = iterator.previous
        }
    }

    [Symbol.iterator] () {
        let iterator = this._head._links[this._index].previous
        return {
            next () {
                if (iterator.cartridge == null || iterator.cartridge._references != 0) {
                    return { done: true, value: null }
                }
                const cartridge = iterator.cartridge
                iterator = iterator.previous
                cartridge._references++
                return { done: false, value: cartridge }
            }
        }
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
    constructor (magazine, keyified, qualified, value) {
        this.magazine = magazine
        this._keyified = keyified
        this.qualified = qualified
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
            magazine.count++
            magazine._heft += this._heft
        }
    }

    _unlink () {
        for (let i = 0, I = this._links.length; i < I; i++) {
            this._links[i].previous.next = this._links[i].next
            this._links[i].next.previous = this._links[i].previous
            const magazine = this.magazine._path[i]
            magazine.count--
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
