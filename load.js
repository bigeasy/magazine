var Cache = require('./magazine')

var magazine = new Cache().createMagazine()

for (var i = 0; i < 1024 * 1024 * 8; i++) {
    magazine.hold(i, i).release()
}

console.log(process.memoryUsage())

var start = process.hrtime()
var cartridge = magazine.hold(1024 * 24, null)
console.log(cartridge.value)
cartridge.release()
console.log(process.hrtime(start))
