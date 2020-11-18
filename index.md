Documentation redux.

Try not to be too ugly.

Notes:

 * There is no way to iterate the collection. It's always hit or miss.
 * There is no peeking or touching.
 * Release early and often.

These notes should be expanded upon and then linked to from the API
documentation so I don't have to expound on wider concepts in the API
documentaion.

```javascript
new Cache
```

Create a new empty cache. There are no public constructor parameters.

```
cache.count
```

The count of entries in the cache.

```
cache.heft
```

The sum of the `heft` of each entry in the cache. The `heft` is the relative
size of the entry value in relation to other entry values in the cache. It is an
optional property and only meaningful if you've set the `heft` property of
individual entries.

```javascript
entry = cache.hold(key)
```

Obtain a reference to an entry in the cache. The method will return an `Entry`
if one exists for the given `key` or `null` if no entry exists.

The `key` can be any JSON serializable object. Keys are compared using their
serialized values and not by object identity. You can use any JSON serializable
JavaScript type. Any objects in the key the same set of key/value pairs are
equivalent regardless of insertion order. This insertion order independent
comparison is obtained by serializing the key using
[Keyify](https://github.com/bigeasy/keyify).

If an entry is returned it must be released using `release()` or removed using
`remove()`. Failure to do so will result in memory leaks when the cache is
unable to evict the entry because it is permenantly referenced.

```javascript
subCache = cache.cache()
```

Create a sub-cache that shares the memory pool of this cache but has a different
set of keys and an independent least-recently used list.

This allows you share a pool of memory accross sub-systems in your program, but
have different eviction strategies for different sub-sytems.

It also allows you to audit reference counting if a sub-system shuts down as
part of normal operation before program shutdown &mdash; you can assert that the
cache for that sub-system is has no referenced entries by evicting down to zero
using `shrink()`.

The parent cache and sub-cache have separate key spaces. Entries added to the
sub-cache are inaccessible to through parent cache. If you add a key to the
sub-cache for which there is an entry in the parent cache you will create a new
separate entry in the sub-cache that is only accessible in the sub-cache.

And vice-versa. If you add a key to the parent cache for which there is an entry
in the sub-cache you will create new separate entry in the parent cache that is
only accessible the parent cache.

The parent cache eviction methods will iterate over both the parent and child
cache entries. The child cache eviction methods will iterate only over the
subset of entries that where added through the child's `hold()` method.

```javascript
entry = cache.hold(key, initialValue)
```

Obtain a reference to an existing entry in the cache for the given `key` or
create a new entry for the `key` using the given `initialValue` if an entry does
not already exist. This get or set behavior is how we resolve race conditions
when populating the cache.

```javascript
entry = cache.hold(key, initializer, heft)
```

Obtain a reference to an existing entry in the cache for the given `key` or
create a new entry for the `key` using the given `initialValue` and `heft` if an
entry does not already exist. This get or set behavior is how we resolve race
conditions when populating the cache.

The `heft` is the relative size of the entry value in relation to other entry
values in the cache.

```javascript
cache.shrink(count)
```

Make a best effort attempt to shrink the `cache.count` down to the given
`count`.

The `shrink()` method will iterate through the least-recently used cache entries
from least-recently used to most-recently used removing entries until the
desired `count` is obtained or the first referenced entry is encountered.

Because we stop when we encounter the first referenced entry, it is important to
release entries as soon as you're done with them. If your program holds onto an
entry indefinately and it does not make any other calls to hold the reference it
will eventually become both the least-recently used entry and referenced. TODO
Expound on this and move it up above the API documentation.

```javascript
cache.purge(heft)
```

Make a best effort attempt to reduce the `cache.heft` down to the given `heft`.

The `shrink()` method will iterate through the least-recently used cache entries
from least-recently used to most-recently used removing entries until the
desired `heft` is obtained or the first referenced entry is encountered.

The sum of the `heft` of each entry in the cache. The `heft` is the relative
size of the entry value in relation to other entry values in the cache. It is an
optional property and only meaningful if you've set the `heft` property of
individual entries.

```javascript
cache.every(({ value, heft }) => {})
```

While there is no way to iterate over keys or entries, nor should there be, we
do provide this dirty little secret for the purposes of asserting the validity
of your cache.

`every` accepts a function that receives and object with a `value` and `heft`
parameter for every entry entry in the cache. This is **not** the entry itself.
Calling `release()` or `remove()` is not necessary and indeed, not possible.

You **should** not use this function to gather up values and you absolutely
**must** not call `cache.hold()` from within the callback function. Calling
`cache.hold()` will change the least-recently used ordering and likely result in
an endless loop.

```javascript
const iterator = cache.evictable()
for (const entry of cache.evictable()) {
    if (<done condition>) {
        entry.release()
        break
    }
    entry.remove()
}
```

Returns a custom eviction strategy iterator. The iterator will iterate through
the cache entries from the least-recently used entry to the most-recently used
entry stopping ...

Probably better to just have `least()`. That's all we're doing here and it is
more explicit.

```javascript
cache.reduce((accumulator, { value, heft }) => {}, initialValue)
```

While there is no way to iterate over keys or entries, nor should there be, we
do provide this dirty little secret for the purposes of asserting the validity
of your cache.

`reduce` accepts a function that receives an `accumulator` and an object with a
`value` and `heft` parameter for every entry entry in the cache. This is **not**
the entry itself. Calling `release()` or `remove()` is not necessary and indeed,
not possible. The return value of the callback function is given to the next
invocation of the callback function. The initial value of the accumulator is
specified with the `initialValue` argument. Unlink JavaScript's
`Array.reduce()`, The `initialValue` argument is required.


You **should** not use this function to gather up values and you absolutely
**must** not call `cache.hold()` from within the callback function. Calling
`cache.hold()` will change the least-recently used ordering and likely result in
an endless loop.
