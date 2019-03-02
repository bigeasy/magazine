require('proof')(5, prove)

function prove (okay) {
    var Cache = require('..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    okay(magazine.holds, 0, 'no holds')
    var cartridge = magazine.hold(1, { number: 1 })
    okay(cartridge.value.number, 1, 'initialize')
    cartridge.value.number++
    okay(magazine.holds, 1, 'one hold')
    cartridge.release()

    var cartridge = magazine.hold(1, { number: 1 })
    okay(cartridge.value.number, 2, 'exists')
    cartridge.release()

    try {
        cartridge.release()
    } catch (e) {
        okay(e.message, 'attempt to release a cartridge not held', 'release not held')
    }
}
