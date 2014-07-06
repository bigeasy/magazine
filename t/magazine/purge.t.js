#!/usr/bin/env node

require('proof')(8, function (equal) {
    var Cache = require('../..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    var cartridge = magazine.hold(1, {})
    cartridge.value.number++
    cartridge.adjustHeft(1)
    cartridge.release()

    var cartridge = magazine.hold(2, {})
    cartridge.adjustHeft(1)
    equal(cache.heft, 2, 'cache full')
    cache.purge(0)
    equal(cache.heft, 1, 'cache purged')
    cartridge.release()

    var cartridge = cache.createMagazine().hold(1, {})
    cartridge.adjustHeft(1)
    cartridge.release()

    var cartridge = magazine.hold(1, {}), gather = []
    cartridge.adjustHeft(1)
    equal(magazine.heft, 2, 'magazine full')
    magazine.purge(0, function () { return false })
    equal(magazine.heft, 2, 'no conditions matched')
    magazine.purge(function () { return true })
    equal(magazine.heft, 2, 'stoped')
    magazine.purge(0, gather)
    equal(magazine.heft, 1, 'magazine purged')
    equal(gather.length, 1, 'gathered')
    cartridge.release()

    equal(cache.heft, 2, 'cache at end')
})
