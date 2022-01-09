/** @param {NS} ns **/
export async function main(ns) {
  let trace = console.trace()
  let stack = new Error().stack

  let sleepOrig = ns.sleep
  ns.sleep = () => {
    return new Promise((resolve, reject) => {
      debugger
    })
  }
  await ns.sleep()

  let exitOrig = ns.exit
  ns.exit = () => {
    console.log(arguments)
    debugger
  }
  ns.exit()

  console.log(ns)
  console.log(trace)
  console.log(stack)
}
