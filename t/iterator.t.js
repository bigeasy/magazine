require('proof')(3, prove)

function prove (okay) {
    var Cache = require('..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    magazine.hold(1, {}).release()

    var iterator = magazine.iterator()

    magazine.hold(2, {}).release()

    magazine.hold(3, {}).remove()

    var keys = [ 1, 2 ]

    while (!iterator.end) {
        okay(iterator.key, keys.shift(), 'key')
        iterator.previous()
    }

    okay(iterator.key, null, 'null key')
}
