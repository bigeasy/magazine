#!/usr/bin/env node

require('proof')(4, function (equal) {
    var Cache = require('../..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    var cartridge = magazine.hold(1, {})
    cartridge.release()

    cartridge = magazine.hold(2, {})
    equal(magazine.count, 2, 'magazine count')
    cache.purge(-1)
    cartridge.release()

    equal(magazine.count, 1, 'magazine count purge cache')

    cartridge = magazine.hold(2, {})
    magazine.purge(-1)
    cartridge.release()

    equal(magazine.count, 1, 'magazine count purge magazie')

    magazine.remove(2)

    equal(magazine.count, 0, 'magazine count remove')
})
