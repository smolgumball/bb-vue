/**
 * Script to open dev menu.
 * Helpful in case you need to pop in there from a non-dev build of the game.
 * @param {NS} ns
 **/
export async function main(ns) {
  let boxes = Array.from(eval('document').querySelectorAll('[class*=MuiBox-root]'))
  let box = boxes.find((x) => hasPlayer(x))
  if (box) {
    let props = getProps(box)
    //  open dev menu
    props.router.toDevMenu()
  }

  function getProps(obj) {
    Object.entries(obj).find((entry) => entry[0].startsWith('__reactProps'))[1].children.props
  }

  function hasPlayer(obj) {
    try {
      return getProps(obj).player ? true : false
    } catch (ex) {
      return false
    }
  }
}
