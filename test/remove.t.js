require('proof')(6, prove)

function prove (okay) {
    var Cache = require('..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    var cartridge = magazine.hold(1, { number: 1 })
    var other = magazine.hold(1, { number: 1 })
    cartridge.adjustHeft(1)
    cartridge.value.number++
    try {
        cartridge.remove()
    } catch (e) {
        okay(e.message, 'attempt to remove cartridge held by others', 'remove held cartridge')
    }
    cartridge.release()
    other.release()

    okay(cache.heft, 1, 'cache heft')
    okay(magazine.heft, 1, 'magazine heft')

    magazine.hold(1, null).remove()

    cartridge = magazine.hold(1, { number: 1 })
    okay(cartridge.value.number, 1, 'was removed')

    okay(cache.heft, 0, 'cache heft reduced')
    okay(magazine.heft, 0, 'magazine heft reduced')
}
