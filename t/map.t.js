require('proof')(4, prove)

function prove (assert) {
    var Cache = require('..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    assert(magazine.get('x') === undefined, 'missing')
    magazine.put('x', 'y')
    assert(magazine.get('x'), 'y', 'found')
    magazine.remove('x')
    assert(magazine.get('x') === undefined, 'removed')
    assert(magazine.get('x', 'y'), 'y', 'primed')
}
