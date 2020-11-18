[![Actions Status](https://github.com/bigeasy/magazine/workflows/Node%20CI/badge.svg)](https://github.com/bigeasy/magazine/actions)
[![codecov](https://codecov.io/gh/bigeasy/magazine/branch/master/graph/badge.svg)](https://codecov.io/gh/bigeasy/magazine)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A LRU cache for memory paging and content caching.

| What          | Where                                         |
| --- | --- |
| Discussion    | https://github.com/bigeasy/magazine/issues/1  |
| Documentation | https://bigeasy.github.io/magazine            |
| Source        | https://github.com/bigeasy/magazine           |
| Issues        | https://github.com/bigeasy/magazine/issues    |
| CI            | https://travis-ci.org/bigeasy/magazine        |
| Coverage:     | https://codecov.io/gh/bigeasy/magazine        |
| License:      | MIT                                           |


```
npm install magazine
```

# Magazine

Magazine is a least-recently used cache.

Magazine is designed for use in database implementations where the cached data
is authorative, representing the latest version of a database page and not
fleeting, cursory nor readily disposable. This is why Magazine exists and why
other LRU caches where not fit for this purpose.

Magazine can also be used as generated content cache and will do a fine job.

Magazine implements a reference counted cache that controls eviction, provides
mechanisms for eviction based on object size instead of object count, allows for
the sub-division of a primary cache into sub-caches. The documentation will
offer suggestions for concurrent file system programming and file locking using
Magazine which you might find interesting regardless of whether or not you adopt
Magazine.

The nicest thing anyone ever said about me on the Internet was this excellent
artible about
[Magazine](http://francescomari.github.io/2014/06/26/the-magazine-cache.html),
however it is sadly out of date now with Magazine 6.0. I've shamelessly borrowed
from this article in this documentation.

## Magazine as Page Cache

There is a [step-by-step tutorial](x) of Magazine. This is a feature overview
for evaluation.

```javascript
const Cache = require('magazine')

// Create a cache.
const cache = new Cache

// Get a value or set it with a default if it doesn't exist.
const entry = cache.hold('one', { number: 1, initialized: false })

// Magazine returns an entry, not a value. The value is a property of the entry.
if (! entry.value.initialized) {
    entry.value.initialized = true
}

// Entries are reference counted and cannot be evicted when references are held.
entry.release()

// Ask the cache to make a best effort to evict entries down to zero.
cache.shrink(0)
```

Every entry in a Magazine **cache** is wrapped in an **entry** object. An
entry represents a piece of data stored in the cache. The entires are added and
retreived using by a key.

The `hold()` method is used to both and retrieve data. It does double duty
because we're not just stashing generated content the way we do in a content
cache. We're storing an authoriative object, one that co-ordinates changes
accross different asynchronous paths of execution.

But, if you really want to use Magazine as a generated content cache, here you
go.

```
const Cache = require('magazine')

// Create a cache.
const cache = new Cache

// Create a get/put/remove wrapper around the cache.
const map = new Cache.Map(cache)

// Hmm… Looks like the other LRU caches have expiration methods, so maybe this
// ought to have one too. Blah. Blah. Okay it will. Let me finish documenting
// the other usage first.
async function webGen () {
    let html = map.get(url)
    if (html == null) {
        html = await genreateWebPage()
        cache.put(url, html)
    }
    send(html)
}
```

When we call `hold()` we pass an initial empty object. You should provide an
object that is relatively cheap to construct since it will be discarded if you
get a cache hit. If you get a cache miss, you can then complete the construction
of the object.

```
const cache = new Magazine

async function getPage (path) {
    const entry = cache.hold(path, { path: path, nodes: null })
    if (entry.value.nodes == null) {
        entry.value.nodes = await load(entry.value.path)
    }
    return entry
}

const entry = await getPage('./tree/root')

addKey(entry.value.nodes, 'some key')

entry.release()
```

In the example above we've implemented a page loading subsystem. A page in a
database is a file that contains a range of records. `async load()` reads a page
from the file system and `addKey()` that adds a key to the page.

We try to `hold()` an existing page object. If the `nodes` property of the page
object is `null`, then we have a newly constructed, uninitialized page. We then
load the page from the file system into the object.

Our function returns the `entry` and not the entry value because we do not want
Magazine to evict the page from memory while we're using it. We'll be
responsible for the entry and release it when we're done using it and it is safe
to evict it.

Of course, the astute reader will notice a race condition in the example above.
If `getPage()` is called simultaneously there will be two calls to `load()` that
are racing to assign the `nodes` property. This is a problem. We are adding a
key to the `nodes` array, but that array might be reassigned and our node
addition lost.

Here is a cannonical `getPage()`.

```javascript
async function getPage (path) {
    const entry = cache.hold(path)
    if (entry == null) {
        const nodes = await load(path)
        return cache.hold(path, { nodes })
    }
    return entry
}
```

A key-only call to `hold` returns `null` on a cache miss. If the entry is null
we load the page. We then add it to the cache using `hold()` which will get an
existing entry or set it with the initializer. In a race between two simulateous
calls, both will load the page from file, but only one will be added to the
cache. Everyone will receive the same entry containing the same nodes array.
Everyone will see the changes to the nodes array.

Magazine is essentially a key/value store, but it does not operate like `Map`
with `get` and `put` operations.

Magazine does not provide `get` and `put` methods like a `Map`. Instead it
provides a `hold()` method that

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
