/**
 * Graciously inspired by Phil:
 * https://github.com/PhilipArmstead/BitBurner-Scripts/blob/main/gui/lib/terminal.js
 * 💖
 */

import { doc, sleep } from '/bb-vue/lib.js'

/**
 * @param {String} command
 * @return {Promise<void>}
 **/
export const termRun = async (command, attempts = 0) => {
  if (attempts > 10) return
  const terminalInput = doc.getElementById('terminal-input')
  if (!terminalInput || terminalInput.hasAttribute('disabled')) {
    let termBtn = contains('[role="button"] div p', 'Terminal')[0]
    if (termBtn) termBtn.click()
    await sleep(50)
    termRun(command, ++attempts)
  } else {
    terminalInput.value = command
    const handler = Object.keys(terminalInput)[1]
    terminalInput[handler].onChange({ target: terminalInput })
    terminalInput[handler].onKeyDown({ keyCode: 13, preventDefault: () => null })
  }
  return true
}

/**
 * @param {String[]} command
 * @return {Promise<void>}
 **/
export const termRunChain = async (command) => await termRun(command.join('; '))

/**
 * Find all elements matching `selector` which also contain `text`
 * @param {string} selector
 * @param {string} text
 * @returns {HTMLElement[]}
 */
function contains(selector, text) {
  var elements = doc.querySelectorAll(selector)
  return Array.prototype.filter.call(elements, function (element) {
    return RegExp(text).test(element.textContent)
  })
}
