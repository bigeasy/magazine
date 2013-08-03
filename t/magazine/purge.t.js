#!/usr/bin/env node

require('proof')(2, function (equal) {
    var Cache = require('../..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    var cartridge = magazine.lock(1, {})
    cartridge.value.number++
    cartridge.adjustHeft(1)
    cartridge.unlock()

    var cartridge = magazine.lock(2, {})
    cartridge.adjustHeft(1)
    equal(cache.heft, 2, 'cache full')
    cache.purge(0)
    equal(cache.heft, 1, 'cache purged')
    cartridge.unlock()
})
