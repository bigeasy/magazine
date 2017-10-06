require('proof')(8, prove)

function prove (assert) {
    var Cache = require('..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    assert(magazine.get('x') === undefined, 'missing')
    assert(magazine.put('x', 'z') === undefined, 'put not there')
    assert(magazine.put('x', 'y'), 'z', 'put replace')
    assert(magazine.get('x'), 'y', 'found')
    assert(magazine.remove('x'), 'y', 'remove')
    assert(magazine.remove('x') === undefined, 'removed')
    assert(magazine.get('x') === undefined, 'ungettable')
    assert(magazine.get('x', 'y'), 'y', 'primed')
}
