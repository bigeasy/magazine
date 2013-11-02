var ok = require('assert').ok

function Cache (constructor) {
    var head = {}
    head._prev = head._next = head

    this._constructor = constructor
    this._cache = {}
    this._head = head
    this._nextKey = 0

    this.heft = 0
}

Cache.prototype.createMagazine = function () {
    var key = ':' + (++this._nextKey) + ':'
    return new Magazine(this, key)
}

Cache.prototype.purge = function (downTo) {
    downTo = Math.max(downTo, 0);
    var head = this._head
    var iterator = head
    while (this.heft > downTo && iterator._prev !== head) {
        var cartridge = iterator._prev
        if (!cartridge._holds) {
            this.heft -= cartridge._heft
            cartridge._magazine.heft -= cartridge._heft
            cartridge._prev._next = cartridge._next
            cartridge._next._prev = cartridge._prev
            delete this._cache[cartridge._key]
        } else {
            iterator = cartridge
        }
    }
}

function Magazine (cache, key) {
    this._cache = cache
    this._key = key
    this.heft = 0
}

Magazine.prototype.hold = function (key, defaultValue) {
    var compoundKey = this._key + key
    var cartridge = this._cache._cache[compoundKey]
    if (!cartridge) {
        if (typeof defaultValue == 'function') {
            defaultValue = defaultValue()
        }
        cartridge = this._cache._cache[compoundKey] = new Cartridge(this, defaultValue, compoundKey)
    } else {
        cartridge._prev._next = cartridge._next
        cartridge._next._prev = cartridge._prev
    }
    cartridge._next = this._cache._head._next
    cartridge._prev = this._cache._head
    cartridge._next._prev = cartridge
    this._cache._head._next = cartridge
    cartridge._holds++
    return cartridge
}

Magazine.prototype.remove = function (key) {
    var compoundKey = this._key + key
    var cartridge = this._cache._cache[compoundKey]
    if (cartridge) {
        if (cartridge._holds) {
            throw new Error('attempt to remove held cartridge')
        }
        this._cache.heft -= cartridge._heft
        cartridge._prev._next = cartridge._next
        cartridge._next._prev = cartridge._prev
        delete this._cache._cache[compoundKey]
    }
}

function Cartridge (magazine, defaultValue, path) {
    this.value = defaultValue
    this._magazine = magazine
    this._path = path
    this._heft = 0
    this._holds = 0
}

Cartridge.prototype.adjustHeft = function (heft) {
    this._heft += heft
    this._magazine.heft += heft
    this._magazine._cache.heft += heft
}

Cartridge.prototype.release = function () {
    if (!this._holds) {
        throw new Error('attempt to release cartridge not held')
    }
    this._holds--
}

module.exports = Cache
