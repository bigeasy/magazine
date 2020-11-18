// These are the hoops you have to jump through to do an external eviction. Not
// simple and having an iterator makes it look too simple. It should look
// appropriately complex.

//
async function evict (cache, expire) {
    for (;;) {
        const entry = cache.least()
        if (entry == null || entry.value.when > expire) {
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
            entry = cache.hold({ data, promise: null ])
        }
        if (entry.promise == null) {
            return entry
        }
        entry.release()
        await entry.value.promise
    }
}
