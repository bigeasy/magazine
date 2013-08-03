#!/usr/bin/env node

require('proof')(2, function (equal) {
    var Cache = require('../..')
    var cache = new Cache
    var magazine = cache.createMagazine('a')

    var cartridge = magazine.lock(1, { number: 1 })
    equal(cartridge.value.number, 1, 'initialize')
    cartridge.value.number++
    cartridge.unlock()

    var cartridge = magazine.lock(1, { number: 1 })
    equal(cartridge.value.number, 2, 'exists')
    cartridge.unlock()
})
