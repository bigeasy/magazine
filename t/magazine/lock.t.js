#!/usr/bin/env node

require('proof')(3, function (equal) {
    var Cache = require('../..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    var cartridge = magazine.hold(1, { number: 1 })
    equal(cartridge.value.number, 1, 'initialize')
    cartridge.value.number++
    cartridge.release()

    var cartridge = magazine.hold(1, { number: 1 })
    equal(cartridge.value.number, 2, 'exists')
    cartridge.release()

    try {
        cartridge.release()
    } catch (e) {
        equal(e.message, 'attempt to release cartridge not held', 'release not held')
    }
})
