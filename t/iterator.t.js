require('proof')(3, prove)

function prove (assert) {
    var Cache = require('..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    magazine.hold(1, {}).release()

    var iterator = magazine.iterator()

    magazine.hold(2, {}).release()

    magazine.hold(3, {}).remove()

    var keys = [ 1, 2 ]

    while (!iterator.end) {
        assert(iterator.key, keys.shift(), 'key')
        iterator.previous()
    }

    assert(iterator.key, null, 'null key')
}
