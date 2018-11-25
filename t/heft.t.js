require('proof')(4, prove)

function prove (okay) {
    var Cache = require('..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    var cartridge = magazine.hold(1, { number: 1 })
    cartridge.adjustHeft(1)
    cartridge.release()

    okay(cache.heft, 1, 'cache heft adjusted')
    okay(magazine.heft, 1, 'magazine heft adjusted')

    cache.purge(0)

    okay(cache.heft, 0, 'cache heft purged')
    okay(magazine.heft, 0, 'magazine heft purged')
}
