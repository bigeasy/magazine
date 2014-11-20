#!/usr/bin/env node

require('proof')(2, function (assert) {
    var Cache = require('../..')
    var now = 0
    var cache = new Cache({ clock: function () { return now++ } })
    var magazine = cache.createMagazine()
    magazine.hold(1, true).release()
    magazine.hold(2, true).release()
    magazine.hold(3, true).release()
    magazine.expire(1)
    assert(magazine.count, 1, 'purge magazine')
    magazine.hold(4, true).release()
    magazine.hold(5, true).release()
    cache.expire(3)
    assert(magazine.count, 1, 'purge cache')
})
