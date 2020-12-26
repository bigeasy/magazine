// These are the hoops you have to jump through to do an external eviction. Not
// simple and having an iterator makes it look too simple. It should look
// appropriately complex.

//
async function evict (cache, expire) {
    for (;;) {
        const entry = cache.least()
        if (entry == null) {
            break
        } else if (entry.value.when > expire) {
            entry.release()
            break
        }
        let resolve
        entry.value.promise = new Promise(_resolve => resolve = _resolve)
        await fs.writeFile(entry.value.path, entry.value.data)
        entry.value.promise = null
        resolve()
        entry.remove()
    }
}

async function get (cache, path) {
    for (;;) {
        let entry = cache.hold(path)
        if (entry == null) {
            const data = await fs.readFile(path)
            entry = cache.hold(path, { data, promise: null ])
        }
        if (entry.promise == null) {
            return entry
        }
        entry.release()
        await entry.value.promise
    }
}
//

// Even more annoying, the data is something that has a close step if the get
// loses a race condition.

// Also, where do these errors go?

async function evict (cache, size) {
    while (cache.size > size) {
        const entry = cache.least()
        if (entry == null) {
            break
        }
        let latch
        entry.value.promise = new Promise(resolve => latch = { resolve })
        try {
            await entry.value.handle.close()
            entry.remove()
        } catch (error) {
            entry.release()
            throw error
        } finally {
            latch.resolve.call(null)
            entry.value.promise = null
        }
    }
}

//
async function get (cache, path) {
    for (;;) {
        const entry = cache.hold(path)
        if (entry == null) {
            const handle = await fs.open(path, 'a')
            const entry = cache.hold(path, null)
            if (entry.value == null) {
                entry.value = { handle, promise: null }
            } else {
                await handle.close()
            }
            return entry
        } else if (entry.promise == null) {
            return entry
        } else {
            entry.release()
            await entry.value.promise
        }
    }
}

// Not as big of a deal as all that for this appending case.
async function evict (cache, size) {
    while (cache.size > size) {
        const entry = cache.least()
        if (entry == null) {
            break
        }
        entry.remove()
        await entry.value.handle.sync()
        await entry.value.handle.close()
    }
}

//
async function get (cache, path) {
    const entry = cache.hold(path)
    if (entry == null) {
        const handle = await fs.open(path, 'a')
        const entry = cache.hold(path, null)
        if (entry.value == null) {
            entry.value = { handle, promise: null }
        } else {
            await handle.close()
        }
        return entry
    }
    return entry
}
