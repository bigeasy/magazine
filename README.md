# Magazine

Excellent article about Magazine:

http://francescomari.github.io/2014/06/26/the-magazine-cache.html

Magazine is a least-recently used cache in JavaScript that divides a common
cache into one or more individual collections.

Here is the basic usage.

```javascript
// create a cache
var Cache = require('magazine')
var cache = new Cache

// create a magazine that stores to the cache
var magazine = cache.createMagazine()

// hold and release to key/value pairs to get them into the magazine
magazine.hold('one', { number: 1 }).release()
magazine.hold('two', { number: 2 }).release()

// wait a second
setTimeout(afterOneSecond, 1000)

function afterOneSecond () {
    // after a second hold and release one of the keys to refresh it
    magazine.hold('one', null).release()

    // wait another second
    setTimeout(afterTwoSeconds, 1000)
}

function afterTwoSeconds () {
    // after two seconds, purge anything that is older than a second and a half
    cache.expire(Date.now() - 1500)

    // hold the one cartidge, the given value is the default value to use if the
    // value does not exist in the cache.
    var cartridge = magazine.hold('one', { number: null })

    // check for a cache hit on one
    if (cartridge.value.number == null) {
        console.log('one is not in cache')
        cartridge.remove()
    } else {
        console.log('one is in cache')
        cartridge.release()
    }

    cartridge = magazine.hold('two', { number: null })

    // check for a cache hit on two
    if (cartridge.value.number == null) {
        console.log('two is not in cache')
        cartridge.remove()
    } else {
        console.log('two is in cache')
        cartridge.release()
    }
}
```

I created Magazine for use wtih [Strata](https://github.com/bigeasy/strata), a
b-tree implementation in pure JavaScript. The b-tree implementation needs a
cache for pages read from disk. Most applications that use Strata are going to
want to use more than one b-tree, but why make the application developer have to
think about tuning the page cache for each b-tree? So I created Magazine, a
common cache has multiple collections.


#### `new Cache`

Create a new cache.

#### `cache.expire(before)`.

Purge the cache removing items before the given date.

#### `iterator = cache.purge()`

Create an iterator over the cache in least recently used order.

#### `magazine = cache.createMagazine()`

Create a magazine using the cache.

#### `magazine.expire(before)`

Expire only the items in the current magazine.

#### `cartridge = magazine.hold(key, value)`

Hold a cartridge for the given key creating a cartridge if one does not exist.

#### `cartridge.release()`

Release the hold on the cartridge.

#### `cartridge.remove()`

Remove the hold the cartridge. You must be the only one holding it to remove it.

#### `cartridge.adjustHeft(value)`

Adjust the heft of the cartridge. Heft is some arbitrary measure of the weight
of cartridge. For cached managed by count, the actual count of items might not
be a the cache entry itself. The cache entry could contain an array of items,
for example, and user wants to purge the cache when it has more than a total
number of items.

#### `cartridge.heft`

An arbitrary measure of the weight of the cartridge.

#### `purge.next()`

Move to the next oldest entry in the queue.

#### `purge.release()`

Releases a cartridge if one is held, a safe way to finalize a purge iteration.
