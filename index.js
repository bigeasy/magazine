var ok = require('assert').ok

function unlink (cartridge, prefix) {
    if (!prefix) {
        unlink(cartridge, 'cache')
        unlink(cartridge, 'magazine')
    } else {
        var prev = '_' + prefix + 'Previous'
        var next = '_' + prefix + 'Next'
        cartridge[prev][next] = cartridge[next]
        cartridge[next][prev] = cartridge[prev]
    }
}

function link (cartridge, previous, prefix) {
    var prev = '_' + prefix + 'Previous'
    var next = '_' + prefix + 'Next'
    cartridge[next] = previous[next]
    cartridge[prev] = previous
    cartridge[next][prev] = cartridge
    previous[next] = cartridge
}

function Cache (constructor) {
    var head = {}
    head._cachePrevious = head._cacheNext = head

    this._constructor = constructor
    this._cache = {}
    this._head = head
    this._nextKey = 0

    this.heft = 0
    this.count = 0
}

Cache.prototype.createMagazine = function () {
    var key = ':' + (++this._nextKey) + ':'
    return new Magazine(this, key)
}

Cache.prototype.purge = function (downTo, condition) {
    condition = condition || function () { return true }
    downTo = Math.max(downTo, -1)
    var head = this._head
    var iterator = head
    while (this.heft > downTo && iterator._cachePrevious !== head) {
        var cartridge = iterator._cachePrevious
        if (!cartridge._holds && condition(cartridge)) {
            this.heft -= cartridge.heft
            cartridge._magazine.heft -= cartridge.heft
            unlink(cartridge)
            delete this._cache[cartridge._compoundKey]
            cartridge._magazine.count--
            this.count--
        } else {
            iterator = cartridge
        }
    }
}

function Magazine (cache, key) {
    var head = {}
    head._magazinePrevious = head._magazineNext = head

    this._cache = cache
    this._key = key
    this._head = head
    this.heft = 0
    this.count = 0
}

Magazine.prototype.hold = function (key, defaultValue) {
    var compoundKey = this._key + key
    var cartridge = this._cache._cache[compoundKey]
    if (!cartridge) {
        if (typeof defaultValue == 'function') {
            defaultValue = defaultValue()
        }
        cartridge = this._cache._cache[compoundKey] = new Cartridge(this, defaultValue, compoundKey)
        this.count++
        this._cache.count++
    } else {
        unlink(cartridge)
    }
    link(cartridge, this._cache._head, 'cache')
    link(cartridge, this._head, 'magazine')
    cartridge._holds++
    return cartridge
}

Magazine.prototype.get = function (key) {
    var compoundKey = this._key + key
    var cartridge = this._cache._cache[compoundKey]
    if (!cartridge || !cartridge._holds) {
        throw new Error('attempt to get a cartridge not held')
    }
    return cartridge
}

Magazine.prototype.remove = function (key) {
    var compoundKey = this._key + key
    var cartridge = this._cache._cache[compoundKey]
    if (cartridge) {
        if (cartridge._holds) {
            throw new Error('attempt to remove held cartridge')
        }
        this._cache.heft -= cartridge.heft
        this.heft -= cartridge.heft
        unlink(cartridge)
        delete this._cache._cache[compoundKey]
        this.count--
        this._cache.count--
    }
}

Magazine.prototype.purge = function (downTo, condition) {
    condition = condition || function () { return true }
    var stop = downTo
    var head = this._head
    var iterator = head
    if (typeof downTo == 'number') {
        downTo = Math.max(downTo, -1)
        stop = function () {
            return this.heft <= downTo
        }.bind(this)
    }
    while (iterator._magazinePrevious !== head) {
        var cartridge = iterator._magazinePrevious
        if (stop(cartridge)) {
            break
        }
        if (!cartridge._holds && condition(cartridge)) {
            this.heft -= cartridge.heft
            this._cache.heft -= cartridge.heft
            unlink(cartridge)
            delete this._cache._cache[cartridge._compoundKey]
            this.count--
            this._cache.count--
        } else {
            iterator = cartridge
        }
    }
}

function Cartridge (magazine, defaultValue, compoundKey) {
    this.value = defaultValue
    this._magazine = magazine
    this._compoundKey = compoundKey
    this.heft = 0
    this._holds = 0
}

Cartridge.prototype.adjustHeft = function (heft) {
    this.heft += heft
    this._magazine.heft += heft
    this._magazine._cache.heft += heft
}

Cartridge.prototype.release = function () {
    if (!this._holds) {
        throw new Error('attempt to release a cartridge not held')
    }
    this._holds--
}

module.exports = Cache
