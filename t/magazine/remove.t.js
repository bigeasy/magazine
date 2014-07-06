#!/usr/bin/env node

require('proof')(6, function (equal) {
    var Cache = require('../..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    var cartridge = magazine.hold(1, { number: 1 })
    var other = magazine.hold(1, { number: 1 })
    cartridge.adjustHeft(1)
    cartridge.value.number++
    try {
        cartridge.remove()
    } catch (e) {
        equal(e.message, 'attempt to remove cartridge held by others', 'remove held cartridge')
    }
    cartridge.release()
    other.release()

    equal(cache.heft, 1, 'cache heft')
    equal(magazine.heft, 1, 'magazine heft')

    magazine.hold(1, null).remove()

    cartridge = magazine.hold(1, { number: 1 })
    equal(cartridge.value.number, 1, 'was removed')

    equal(cache.heft, 0, 'cache heft reduced')
    equal(magazine.heft, 0, 'magazine heft reduced')
})
