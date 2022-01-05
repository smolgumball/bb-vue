import dep from '/bug__stuck-blobs/dep.js'

/**
 * @param {NS} ns
 **/
export async function main(ns) {
  ns.tprint(new dep().report())
}
