var ok = require('assert').ok

function Cache (constructor) {
    var head = {}
    head._prev = head._next = head

    this._constructor = constructor
    this._cache = {}
    this._head = head
    this._heft = 0
}

Cache.prototype.createMagazine = function (key) {
    if (this._cache[key]) {
        throw new Error('magazine already exists')
    }
    this._cache[key] = {}
    return new Magazine(this, key)
}

Cache.prototype.purge = function (downTo) {
    downTo = Math.max(downTo, 0);
    var head = this._head
    var iterator = head
    while (this._heft > downTo && iterator.previous !== head) {
        var cartridge = iterator.previous
        if (!cartridge._locks) {
            this._heft -= cartridge._heft
            cartridge._prev._next = cartridge._next
            cartridge._next._prev = cartridge._prev
            delete this._cache[cartridge._key[0]][cartridge._key[1]]
        } else {
            iterator = cartridge
        }
    }
}

function Magazine (cache, key) {
    this._cache = cache
    this._key = key
}

Magazine.prototype.lock = function (key, defaultValue) {
    var cache = this._cache._cache[this._key]
    var cartridge = cache[key]
    if (!cartridge) {
        cartridge = cache[key] = new Cartridge(this, defaultValue, [ this._key, key ])
    } else {
        cartridge._prev._next = cartridge._next
        cartridge._next._prev = cartridge._prev
    }
    cartridge._next = this._cache._head._next
    cartridge._prev = this._cache._head
    cartridge._next._prev = cartridge
    this._cache._head._next = cartridge
    cartridge._locks++
    return cartridge
}

Magazine.prototype.purge = function (key) {
    var cache = this._cache._cache[this._key]
    var cartridge = cache[key]
    if (cartridge) {
        if (cartridge._locks) {
            throw new Error('attempt to purge locked cartridge')
        }
        this._cache._heft -= cartridge._heft
        cartridge._prev._next = cartridge._next
        cartridge._next._prev = cartridge._prev
        delete cache[key]
    }
}

function Cartridge (magazine, defaultValue, path) {
    this.value = defaultValue
    this._magazine = magazine
    this._path = path
    this._heft = 0
    this._locks = 0
}

Cartridge.prototype.adjustHeft = function (heft) {
    this._heft += heft
    this._magazine._cache._heft += heft
}

Cartridge.prototype.unlock = function (heft) {
    if (!this._locks) {
        throw new Error('attempt to unlock unlocked cartridge')
    }
    this._locks--
}

module.exports = Cache
