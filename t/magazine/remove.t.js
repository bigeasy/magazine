#!/usr/bin/env node

require('proof')(3, function (equal) {
    var Cache = require('../..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    var cartridge = magazine.lock(1, { number: 1 })
    cartridge.value.number++
    try {
        magazine.remove(1)
    } catch (e) {
        equal(e.message, 'attempt to remove locked cartridge', 'remove locked cartridge')
    }
    cartridge.unlock()

    magazine.remove(1)
    magazine.remove(1)

    cartridge = magazine.lock(1, { number: 1 })
    equal(cartridge.value.number, 1, 'was removed')
    equal(cache.heft, 0, 'heft reduced')
})
