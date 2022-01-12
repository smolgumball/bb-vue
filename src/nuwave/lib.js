export function timeDiff(timeStart, timeEnd) {
  let diff = timeEnd - timeStart
  var hours = Math.floor(diff / (1000 * 60 * 60))
  diff -= hours * (1000 * 60 * 60)
  var mins = Math.floor(diff / (1000 * 60))
  diff -= mins * (1000 * 60)
  var secs = Math.floor(diff / 1000)
  diff -= secs * 1000
  var ms = Math.floor(diff)
  diff -= ms
  let toRet = []
  if (hours > 0) {
    toRet.push(`${hours}h`)
  }
  if (mins > 0) {
    toRet.push(`${mins}m`)
  }
  if (secs > 0) {
    toRet.push(`${secs}s`)
  }
  if (ms > 0 && !secs) {
    toRet.push(`${ms}ms`)
  }
  return toRet.join(' ')
}
