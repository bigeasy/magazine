#!/usr/bin/env node

require('proof')(1, function (equal) {
    var Cache = require('../..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    var cartridge = magazine.hold(1, { number: 1 })
    cartridge.adjustHeft(1)
    cartridge.release()

    equal(cache.heft, 1, 'heft adjusted')
})
