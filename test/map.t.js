require('proof')(8, prove)

function prove (okay) {
    var Cache = require('..')
    var cache = new Cache
    var magazine = cache.createMagazine()

    okay(magazine.get('x') === undefined, 'missing')
    okay(magazine.put('x', 'z') === undefined, 'put not there')
    okay(magazine.put('x', 'y'), 'z', 'put replace')
    okay(magazine.get('x'), 'y', 'found')
    okay(magazine.remove('x'), 'y', 'remove')
    okay(magazine.remove('x') === undefined, 'removed')
    okay(magazine.get('x') === undefined, 'ungettable')
    okay(magazine.get('x', 'y'), 'y', 'primed')
}
