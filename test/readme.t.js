// # Magazine
//
// Magazine is an LRU cache. It was designed to cache database pages. It
// provides a reference counted hold and release mechanism so that the pages
// will not be evicted when they are in use. It can also be used as an
// generated content cache, which is what most of the caches on NPM are.
//
// This unit test represents a tour of Magazine and is a stub for some actual
// documentation that I may write someday. It is part of Magazines's unit test
// suite and lives in the Magazine repository. You can run this readme yourself.
//
// ```text
// git clone git@github.com:bigeasy/magazine.git
// cd magazine
// npm install --no-package-lock --no-save
// node test/readme.t.js
// ```
//
// Note that you should run `node test/readme.t.js` directly and not `npm test`
// to see the output from this walk-through.
//
// This walk-through uses the [Proof](https://github.com/bigeasy/proof) unit
// test framework. Proof will setup an `async` function that will catch and
// report any exceptions. We'll use Proof's `okay` function to assert the points
// we make about Magazine.

//
require('proof')(66, async okay => {
//

    // First we'll talk about the basics of Magazine. Some of the functionality
    // may seem sub-optimal at first, but it will make more sense when we move
    // along into practical examples of usage.

    // Next we'll talk about different eviction strategies.

    // We'll show some practical examples with some wrapper functions that use
    // Magazine as a file cache.

    // We'll look at how to share a single Magazine across multiple program
    // services using sub-caches.

    // We'll look at how to use Magazine as a generated content cache.

    // There will be some hard and fast rules that you should never break stated
    // in the first part of the documentations that we will spend the latter
    // half of the documentation breaking.

    // Here we have to use a relative path to `require` Magazine because we run
    // this tutorial as a unit test in the project directory.
    //
    // To use `Magazine` in your application, include it with the following.
    //
    // ```javascript
    // const Magazine = require('magazine')
    // ```

    //
    const Magazine = require('..')
    //

    // Magazine stores data as key/value pairs. It provides methods for adding
    // cache entries, explicitly removing cache entries by key, and evicting
    // stale entries to free up memory.

    // Magazine exports a `Magazine` object. This is the root of your cache.
    // To get started you create a magazine object using the `Magazine`
    // constructor. The `Magazine` constructor takes no arguments.

    //
    const magazine = new Magazine

    // Now you have an empty `Magazine`. There should be no items in the
    // magazine.

    //
    okay(magazine.count, 0, 'empty magazine')
    //

    // The cached data is saved in your `Magazine` instance. The data is stored
    // as key value pairs. Every key value pair is wrapped in a **cartridge**
    // which acts as slot for a single piece of data.
    //
    // You use the `hold()` function to both add and retreive data from the
    // magazine. When adding an item to the cache `hold()` takes two arguments
    // &mdash; a key for the entry and an intial value to use to initialize the
    // cartridge `value` if the entry does not already exist in the cache.

    //
    {
        const cartridge = magazine.hold('a', 1)
        okay(cartridge.value, 1, 'item initialized')
        cartridge.release()

        okay(magazine.count, 1, 'single item in cache')
    }
    //

    // The cartridge is more than a simple wrapper around a key/value pair. It
    // has a reference count that represents the number of active holders of the
    // item. The magazine uses this to determine if an item can be evicted from
    // the cache when it tries to free up memory.
    //
    // The magazine needs your help, though. You **must** release the cartridge
    // by calling `release()` when you are done accessing the cached data.
    //
    // Once the data is in cache you can retrieve it using `hold()`. When the
    // data already exists in the cache, the magazine will ignore your
    // initializtion value because it does not need to create a new cartridge.
    // It will return the existing cartridge which will have the current value
    // associated with the key.

    //
    {
        const cartridge = magazine.hold('a')
        okay(!! cartridge, 'item exists')
        okay(cartridge.value, 1, 'item existed')
        cartridge.release()

        okay(magazine.count, 1, 'still a single item in cache')
    }
    //

    //
    {
        const cartridge = magazine.hold('a', 9999)
        okay(cartridge.value, 1, 'item existed')
        cartridge.release()

        okay(magazine.count, 1, 'still a single item in cache')
    }
    //

    // Notice that the entry is still in the cache. Releasing the cartridge by
    // calling `release()` does not remove it from the cache, it merely let's
    // the cache know that it _could_ be removed during cache eviction.
    //
    // If we only want to retrieve an item with call `hold()` with a single
    // argument,
    //
    // Immutability is all the rage in certain circles, but not here. The
    // objects in the cache are mutable if you want them to be. You are
    // encouraged to change the state of the objects you store in the cache. You
    // can even reassign a cache entry value after you've created it.

    //
    {
        const set = magazine.hold('b', 2)
        okay(set.value, 2, 'second item initialized')
        set.release()

        okay(magazine.count, 2, 'two items in cache')

        const get = magazine.hold('b')
        okay(get.value, 2, 'second item still set')
        // We changed the value. No big deal.
        get.value = 3
        get.release()
    }
    //

    // In the example above we created a new entry and released it. We then
    // retrieved the entry and changed its value. This is perfectly okay if you
    // find it useful. Later on we'll show you how you can use cached objects to
    // coordinate concurrent access to the file system.

    // Our cache is getting full, isn't it? We now have two items in the cache.
    // We should save some memory by evicting some entries from the cache.
    // Before we look at eviction let's have one last look at our first item.

    //
    {
        const cartridge = magazine.hold('a')
        okay(cartridge.value, 1, 'item still exists')
        cartridge.release()

        okay(magazine.count, 2, 'still a two items in cache')
    }
    //

    // Okay, now we need to make space in memory. Let's evict some entries using
    // the `shrink()` function. The shrink function takes a single argument
    // &mdash; a target count to shrink down to.

    //
    {
        magazine.shrink(1)

        okay(magazine.count, 1, 'one item evicted from the cache')
    }
    //

    // We've now reclaimed memory by shrinking the count of items in the cache
    // from 2 items to 1 item. But, which item is was evicted? That would be the
    // second item, the one with the key `'b'`.
    //
    // Why did `'b'` get the boot and and not `'a'`? Because it was the
    // least-recently used entry. Just prior to calling `shrink()` we held onto
    // `'a'` and released it. When we did that made it the most-recently used
    // entry in the cache. `'b'` became the least recently used entry.
    //
    // When you call `hold()` and `release()` you increase the priority of the
    // entry in the cache. The longer and entry goes without being held, the
    // more likely it will be evicted at eviction time.

    //
    {
        const cartridge = magazine.hold('a')
        okay(!! cartridge, 'frist item exists')
        cartridge.release()

        okay(! magazine.hold('b'), 'second item does not exist')
    }
    //

    // Cache eviction is advisory. The cache may not be able to satisfy the
    // request because the cache entries are held and in use. If you run an
    // eviction with a goal that cannot be satisfied, the eviction does the best
    // it can, but it does not raise any errors. Try again later.

    //
    {
        const cartridge = magazine.hold('a')
        magazine.shrink(0)
        okay(magazine.count, 1, 'did not evict first entry because it is held')
        cartridge.release()
        magazine.shrink(0)
        okay(magazine.count, 0, 'first entry evicted because it is not held')
    }
    //

    // You're probably wondering why `hold()` does double duty, both setting
    // values and getting values. That's because when we don't often simply get
    // and put items in a cache from the application. That is, we don't often
    // use the cache as a we would a JavaScript `Map` getting and putting object
    // by key. We are usually checking the cache and then performing an
    // asynchronous action if we have a cache miss. That asynchronous action is
    // going to lead to race conditions and the `hold()` function helps us
    // resolve those races.
    //
    // Let's use a file cache as an example. Let's create a sub-system that
    // reads files from this here file system.

    // _Use the Node.js Promises based file system API._
    const fs = require('fs').promises
    //

    //
    async function read (cache, file) {
        let entry = cache.hold(file), missed = false
        if (entry == null) {
            missed = true
            const data = await fs.readFile(file)
            entry = cache.hold(file, { data, viewed: false, liked: false })
        }
        return { entry, missed }
    }
    //

    // When we enter the function we try to read the file from the cache. If the
    // entry does not exist, then we read from the file system. When our file
    // read returns, we add the file data to the cache.
    //
    // If you look closely, you can see a data race. The entry has the file data
    // but it also has a boolean flag. Because the read is asynchronous, there
    // could be two simultaeous reads of the file. The first to complete will
    // get the new file object. If the cache simply put the cache values into
    // the cache no questions asked then the file read of the second invocation
    // returned, the file object would be overwritten. The first caller might be
    // changing the flags, but the second caller would have a completely
    // different object and would not see the changes.
    //
    // Because `hold()` only creates a new entry if none exists, and returns the
    // existing entry, both callers will have the same object. The file read
    // from second invocation would not be used and the results of the file read
    // are discarded, they are collected by the garbage collector.
    //
    // Let's race our file requests and see that they both return the same
    // objects.

    //
    {
        const promises = [
            read(magazine, __filename),
            read(magazine, __filename)
        ]
        const first = await promises[0]
        first.entry.value.liked = true

        const second = await promises[0]
        okay([ first.missed, second.missed ], [ true, true ], 'both missed')
        okay(first.entry.value === second.entry.value, 'objects returned are the same')
        okay(first.entry.value.liked == second.entry.value.liked, 'objects have same flag values')
        first.entry.release()
        second.entry.release()

        const third = await read(magazine, __filename)
        okay(! third.missed, 'cache hit')
        okay(third.entry.value === first.entry.value, 'cache hit value same as loaded value')
        third.entry.release()
    }
    //

    // Now have look too at what we're returning. We're not returning the cached
    // value but the cache entry.

    // Now that we're caching files it's time to revisit our eviction strategy.
    // When all the objects in the cache are roughtly the same size, we can
    // evict using `shrink()` to maintain a cache of a certain number of
    // objects. We can log the entry count and look at the memory usage of our
    // program and know that if we change the maximum cache size memory usage
    // will change linearly.
    //
    // But now we're caching files. Some could be small. Some could be big. We
    // might say that a cache of 10000 files is the right size when the files
    // are 4KB, then someone runs the program to read 1TB files.
    //
    // To address this we have the concept of heft. Heft is an approximation of
    // the size of an object in the cache. We don't know the exact size of
    // JavaScript object in memory, but sometime we can get an approximate size,
    // or at the very least a good indication of the size of an object relative
    // to other objects in the cache.
    //
    // Let's rewrite our file system example and use the byte length of the file
    // we read as the relative size of the object.

    //
    async function heftyRead (cache, file) {
        let entry = cache.hold(file), missed = false
        if (entry == null) {
            missed = true
            const data = await fs.readFile(file)
            // _Call hold with a `heft` parameter._
            entry = cache.hold(file, { data, viewed: false, liked: false }, data.length)
        }
        return { entry, missed }
    }
    //

    // In the function above we call `hold` with an additional parameter that is
    // the relative size of the object in the cache. We pass in the `length`
    // property of the buffer read from the file system. Just like the
    // initialization parameter, if the entry already exists in the cache the
    // heft is ignored.

    // _Use the Node.js `path` module to find another file to read._
    const path = require('path')

    const files = {
        test: __filename,
        source: path.resolve(__dirname, '../magazine.js')
    }

    //
    {
        okay(magazine.heft, 0, 'cache has no heft')
        const { entry, missed } = await heftyRead(magazine, files.source)
        okay(missed, 'entry was added to cache')
        okay(magazine.heft != 0, 'cache has some heft')
        entry.release()
    }
    //

    // The `heft` property of the cache is the sum of the heft of all the
    // objects in the cache. In the above example our cache started with no heft
    // but after we added an entry with a heft parameter the cache had some
    // heft.
    //
    // The entry also has a `heft` property.

    //
    {
        const source = magazine.hold(files.source)
        okay(source.heft == source.value.data.length, 'the heft of the entry is the byte length of the file')
        source.release()
    }
    //

    // You can adjust the `heft` property  of an entry. When you do, the `heft`
    // property of cache is updated so that the sum of the heft of all the
    // entries in the cache reflects the changes.
    //
    // Let's update the `heft` property first file we read into the cache.

    //
    {
        const heft = magazine.heft
        const test = magazine.hold(files.test)
        test.heft = test.value.data.length
        okay(magazine.heft == heft + test.heft, 'the cache heft was updated')
        test.release()
    }
    //

    // Note that the `heft` property of the cache is read-only. You can only
    // change the `heft` property of an entry.
    //
    // When we using `heft` to give us a relative size of objects in the cache,
    // we use `purge()` to evict entries from the cache instead of `shrink()`.
    // `purge()` evicts entries from the cache down to the desired `heft`, while
    // `shrink()` evicts entry from the cache down to the desired `count`.

    //
    {
        const heft = 1024 * 24
        okay(magazine.heft > heft, 'desired heft not met')
        okay(magazine.count, 2, 'two files in the cache')
        magazine.purge(heft)
        okay(magazine.count, 1, 'one file evicted from the cache')
        okay(magazine.heft <= heft, 'desired heft achieved')
        okay(! magazine.hold(files.source), 'source file was removed')
    }
    //

    // So far we've used cache eviction to remove entries from the cache. There
    // will be times, however, when we want to explicitly remove a specific item
    // from the cache. We can do this using the `remove()` method of the cache
    // entry.

    //
    {
        okay(magazine.count, 1, 'one file left in cache')
        const entry = magazine.hold(files.test, null)
        entry.remove()
        okay(magazine.count, 0, 'file explicitly removed from cache')
    }
    //

    // We held an entry for the remaining file in the cache and then removed it.
    // We didn't have to perform any tests to see if the file was actually
    // there. If the file is missing an entry with a `null` value is created and
    // that entry is immediately removed. We can actually do this as a one
    // liner.

    //
    {
        okay(magazine.count, 0, 'cache empty')
        magazine.hold(files.source, null).remove()
        okay(magazine.count, 0, 'cache entry added and immediately deleted')
    }
    //

    // Magazine also provides and eviction iterator. Using this iterator along
    // with `remove()` you can create your own custom eviction strategy. The
    // eviction iterator iterates from the least-recently used entry to the
    // most-recently used entry and terminates early when it encoutners and
    // entry that is currently held.
    //
    // Sometimes you want to evict entries based on the amount of time spent in
    // the cache. One common case is when you're using the cache to store
    // authentication tokens that expire after a timeout. We can add a timestamp
    // to the entry and use that timestamp to determine if the entry should be
    // evicted.

    //
    // _Use the Node.js `crypto` API for random bytes._
    const crypto = require('crypto')

    function generate (cache) {
        const token = crypto.randomBytes(16).toString('hex')
        cache.hold(token, { when: Date.now() }).release()
        return token
    }

    function authenticate (cache, token) {
        const entry = cache.hold(token)
        if (entry != null) {
            entry.remove()
            return true
        }
        return false
    }

    function expireLeast (cache, timeout) {
        const expired = Date.now() - timeout

        let entry
        while ((entry = cache.least()) != null) {
            if (entry.value.when > expired) {
                entry.release()
                break
            }
            entry.remove()
        }
    }

    function expire (cache, timeout) {
        const expired = Date.now() - timeout

        for (const entry of magazine) {
            if (entry.value.when, expired, entry.value.when > expired) {
                entry.release()
                break
            }
            entry.remove()
        }
    }

    //

    //
    {
        const tokens = []

        tokens.push(generate(magazine))

        await new Promise(resolve => setTimeout(resolve, 51))

        tokens.push(generate(magazine))

        okay(magazine.count, 2, 'two tokens in cache')

        expire(magazine, 50)

        okay(magazine.count, 1, 'one token expired')

        okay(! authenticate(magazine, tokens.shift()), 'oldest token is now invalid')
        okay(authenticate(magazine, tokens.shift()), 'newest token is still valid')

        okay(magazine.count, 0, 'consuming a token deletes it')
    }
    //

    // The iterator the entries held but does not update their recently-used
    // priority, so iterating entries will not reset change their eviction
    // priority.

    //
    {
        magazine.hold(1, 'a').release()
        magazine.hold(2, 'b').release()
        magazine.hold(3, 'c').release()
        magazine.hold(1, 'a').release()

        const seen = []
        for (const entry of magazine) {
            seen.push(entry.value)
            entry.release()
        }
        okay(seen, [ 'b', 'c', 'a' ], 'seen')

        const entry = magazine.hold(1)

        seen.length = 0
        for (const entry of magazine) {
            seen.push(entry.value)
            entry.release()
        }
        okay(seen, [ 'b', 'c' ], 'seen')

        entry.release()

        for (const entry of magazine) {
            entry.remove()
        }

        okay(magazine.count, 0, 'enough of this silliness')
    }
    //

    // You can use Magazine to create a root cache with sub-caches. The root
    // cache maintains a LRU list across all caches. The sub-caches maintain an
    // additional LRU list. Allows your application to share a single cache
    // across different concerns, possibly using different eviction stratgies
    // for different concerns.

    //
    {
        magazine.hold('a', 1).release()
        okay(magazine.count, 1, 'parent cache count')

        const database = magazine.magazine()

        database.hold('a', 2).release()

        okay(database.count, 1, 'sub-cache count')
        okay(magazine.count, 2, 'parent count now doubled')

        const parent = magazine.hold('a')
        const child = database.hold('a')

        okay({
            parent: parent.value,
            child: child.value
        }, {
            parent: 1,
            child: 2
        }, 'parent and child values are different for same key')

        parent.release()
        child.release()

        database.hold('b', 3).release()

        okay(database.count, 2, 'second item in child')
        okay(magazine.count, 3, 'three items in parent')

        database.shrink(1)

        okay(database.count, 1, 'child shrunk by one')
        okay(magazine.count, 2, 'parent shrunk by one')

        magazine.shrink(0)

        okay(database.count, 0, 'child empty')
        okay(magazine.count, 0, 'parent empty')
    }

    {
        const map = new Magazine.Map(magazine)

        function generate (cache) {
            const bytes = crypto.randomBytes(16).toString('hex')
            return map.put(bytes, { when: Date.now() })
        }

        function autenticate (cache, token) {
            return map.remove(token) != null
        }

        const token = generate(magazine)
        okay(! autenticate(magazine, token), 'okay')
    }

    {
        const map = new Magazine.Map(magazine)

        okay(map.get('a') === undefined, 'got missing')
        okay(map.get('a', 1), 1, 'get or set')
        okay(map.get('a'), 1, 'get not missing')
        okay(map.put('a', 2), 1, 'put returns previous value')
        okay(map.get('a'), 2, 'put sets an existing entry')
        okay(map.put('z') === undefined, 'put returns `undefined` if there is no previous value')
        okay(map.remove('a'), 2, 'remove returns removed value')
        okay(map.remove('q') === undefined, 'remove returns `undefined` if the entry does not exist')
    }

    {
        const log = []

        async function lock (cache, key) {
            for (;;) {
                const entry = cache.hold(key, { promise: null, resolve: null, data: null })
                if (entry.value.promise == null) {
                    entry.value.promise = new Promise(resolve => entry.value.resolve = resolve)
                    return entry
                }
                log.push('waiting')
                await entry.value.promise
                entry.release()
            }
        }

        function unlock (entry) {
            entry.value.resolve()
            entry.value.promise = entry.value.resolve = null
            entry.release()
        }

        const first = await lock(magazine, 'a')
        const promise = lock(magazine, 'a')
        first.value.data = 1
        unlock(first)
        const second = await promise
        okay(second.value.data, 1, 'guarded data was set')
        unlock(second)
        okay(log, [ 'waiting' ], 'someone had to wait')
    }
})
