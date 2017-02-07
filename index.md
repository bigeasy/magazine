Magazine is a versatile least-recently used in-memory cache for use in your
Node.js applications.

It is a simple key/value store. It can be used any place where you'd use an
JavaScript `Object` as a map.

Also, have a look at the [Docco](./docco/).

### Key Concepts

A **magazine** is a key/value store for JavaScript objects. A **cartridge** is
an entry in the magazine, it is an reference-counted wrapper around the stored
data. A **cache** is a single common backing store for one or more magazines.

Why have a **cartrdige**? It is a wrapper that tracks cache meta data and
performs reference counting. It also provides methods to release a hold on the
cartridge and to remove the cartridge from the magazine.

### Hold and Release

Cartridges are retrieved from the magazine using the `hold` method. When you
hold a cartridge it will not be removed by a cache purge. When you are finished
with the cartridge you must invoke the `release` method to decrement the
reference count.

```javascript
var assert = require('assert'),
    Cache = require('magazine')

var cache = new Cache,
    magazine = cache.createMagazine()

var cartridge = magazine.hold('one', 1)
assert.equal(cartridge.value, 1, 'key exists')
cartridge.release()

```

The `hold` method is a get or put-and-get method. It requires a key and an
initial value. If the key exists in the magazine, the existing value is returned
in its cartridge and the initial value is discarded. If the key does not exist,
the key is added to the magazine mapped to a cartridge containing the initial
value and the initial value is returned.

```javascript
var assert = require('assert'),
    Cache = require('magazine')

var cache = new Cache,
    magazine = cache.createMagazine()

var cartridge = magazine.hold('x', 1)
assert.equal(cartridge.value, 1, 'key exists')
cartridge.release()

var cartridge = magazine.hold('x', 2)
assert.equal(cartridge.value, 1, 'key already existed')
cartridge.release()
```

### Remove

To remove a cartridge from the store you invoke the `remove` method of the
cartridge.

```javascript
var assert = require('assert'),
    Cache = require('magazine')

var cache = new Cache,
    magazine = cache.createMagazine()

var cartridge = magazine.hold('x', 1)
assert.equal(cartridge.value, 1, 'key exists')
cartridge.release()

magazine.hold('x').remove()

var cartridge = magazine.hold('x', 2)
assert.equal(cartridge.value, 2, 'key was removed')
cartridge.release()
```

### Purge

We use a `purge` iteator to clear the cache of it's least recently used items. A
`purge` iterator iterates over the cartridges in a magazine returning the
cartridges that have no outstanding holds.

The `purge` iterator has a `cartridge` property that represents the current
cartridge of the iteration and a `next` method to go to the next cartridge.
Before you can call `next` you must either `release` or `remove` the current
cartridge.

The `purge` iterator also has a `release` method. When you break from a purge
loop you call teh `release` method of `purge` iterator to clean up after purge.
If the current cartridge is not null, the `release` method of the cartridge is
invoked.

```javascript
var purge = magazine.purge()
while (purge.cartridge && magazine.count < 64) {
    purge.cartridge.release()
    purge.next()
}
purge.release()
```

### Authentication Token Cache

```javascript
var magazine = (new Cache).createMagazine()

function createToken (clientId) {
    var hash = crypto.createHash('sha1')
    hash.update(crypto.randomBytes(16))
    var token = hash.digest('hex')
    magazine.hold(token, clientId).release()
    return token
}

function checkToken (token) {
    expireTokens()
    var clientId, cartridge = magazine.hold(token, false)
    if (clientId = cartridge.value) cartridge.release()
    else cartridge.remove()
    return clientId
}

function expireTokens () {
    var purge = magazine.purge()
    var expired = Date.now() - 1000 * 60 * 20 // twenty minutes
    while (purge.cartridge && purge.cartridge.when <= expired) {
        purge.cartridge.release()
        purge.next()
    }
    purge.release()
}
```

### Caches and Magazines

What is the difference beween a **cache** and **magazine**? A cache is a
collection of one or more magazines. One or more magazines store their data in
the cache, but they each have their own key namespace.

You can create many magazines, each with their own key space, but with one
common least-recently used collection. The application can use different
magazines as key/value stores, but have a single piont to run the purge of all
the magazines of a given type.

Think about how you use JavaScript objects as maps and how cumbersome it would
be if you were only allowed to do this once per program.
