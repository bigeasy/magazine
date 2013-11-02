#!/usr/bin/env node

require('proof')(4, function (equal) {
    var Cache = require('../..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    var cartridge = magazine.hold(1, { number: 1 })
    cartridge.adjustHeft(1)
    cartridge.release()

    equal(cache.heft, 1, 'cache heft adjusted')
    equal(magazine.heft, 1, 'magazine heft adjusted')

    cache.purge(0)

    equal(cache.heft, 0, 'cache heft purged')
    equal(magazine.heft, 0, 'magazine heft purged')
})
