require('proof')(9, prove)

function prove (okay) {
    var Cache = require('..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    var cartridge = magazine.hold(1, {})
    cartridge.value.number++
    cartridge.adjustHeft(1)
    cartridge.release()

    var cartridge = magazine.hold(2, {})
    cartridge.adjustHeft(1)
    okay(cache.heft, 2, 'cache full')
    cache.purge(0)
    okay(cache.heft, 1, 'cache purged')
    cartridge.release()

    var cartridge = cache.createMagazine().hold(1, {})
    cartridge.adjustHeft(1)
    cartridge.release()

    var cartridge = magazine.hold(1, {}), gather = []
    cartridge.adjustHeft(1)
    okay(magazine.heft, 2, 'magazine full')
    magazine.purge(0, function () { return false })
    okay(magazine.heft, 2, 'no conditions matched')
    magazine.purge(function () { return true })
    okay(magazine.heft, 2, 'stoped')
    magazine.purge(0, gather)
    okay(magazine.heft, 1, 'magazine purged')
    okay(gather.length, 1, 'gathered')
    cartridge.release()

    okay(cache.heft, 2, 'cache at end')

    cache.purge().release()

    var purge = cache.purge()
    while (purge.cartridge) {
        purge.cartridge.release()
        purge.next()
    }
    purge.release()

    var purge = cache.purge()
    okay(purge.cartridge, 'purge cartridge')
    purge.release()
}
