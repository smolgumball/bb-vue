//
//
// NOTE:
// Ideally some of these files would be in separate resource folders,
// but I've been running into circular reference issues in-game :verysadge:
//
//

//
//
// CONSTANTS /////////////
// -----------------------------------------
// --------------------------------------------------------------

/**
 * Keys used for globalThis storage and lookup
 */
export const Keys = Object.freeze({
  libKey: 'bbVue',
  vueModuleKey: 'Vue',
  vueUseModuleKey: 'VueUse',
  mittModuleKey: 'Mitt',
  rootAppKey: 'rootApp',
  globalBusKey: 'rootBus',
})

/**
 * Tokens used when processing a consumer app style and template values
 */
export const ReplacementTokens = Object.freeze({
  appId: '__APP_ID__',
  componentName: '__CMP_NAME__',
})

/**
 * Number helpers
 */
export const num = {
  sec: 1000,
  min: 1000 * 60,
  hour: 1000 * 60 * 60,
  mil: 1e6,
  bil: 1e9,
}

//
//
// GLOBALS MANAGEMENT /////////////
// -----------------------------------------
// --------------------------------------------------------------

export const RootApp = {
  rootAttr: 'bbv-root',
  raw() {
    return getGlobal(Keys.rootAppKey)
  },
  instance() {
    return this.raw()?._instance
  },
  appDef() {
    return this.raw()?._component
  },
  component() {
    return this.instance()?.ctx
  },
  set(val) {
    return setGlobal(Keys.rootAppKey, val)
  },
  async rootShutdown() {
    try {
      await this.component()?.rootShutdown()
    } catch (error) {
      console.debug("bb-vue: Issue with rootShutdown on AppRoot, but don't worry about it")
    }
  },
  async cleanup() {
    await sleep(15)
    try {
      this.raw()?.unmount()
    } catch (error) {
      console.debug("bb-vue: Issue cleaning up AppRoot, but don't worry about it")
    }
    await this.removeDom()
    deleteGlobal(Keys.rootAppKey)
    await sleep(15)
  },
  async removeDom() {
    await sleep(15)
    doc.querySelector(`[${this.rootAttr}]`)?.['remove']()
  },
  async addDom(appId) {
    doc.body.insertAdjacentHTML('afterbegin', html`<div id="${appId}" bbv-root></div>`)
    await sleep(15)
  },
}

/**
 * Reference to window global
 */
export const win = globalThis['window']

/**
 * Reference to document global
 */
export const doc = globalThis['document']

/**
 * Reference to bundled lodash library
 */
export const lodash = win._

/**
 * Initialize globalThis storage
 */
if (lodash.isObjectLike(win[Keys.libKey]) === false) {
  win[Keys.libKey] = {}
}

/**
 * Sets a value by key to internal library storage
 * @param {String} key Path to set, utilizing `lodash.set`
 * @param {any} value
 * @returns {any} A reference to the value passed in, from the store
 * * @see https://lodash.com/docs/4.17.15#set
 */
export function setGlobal(key, value) {
  lodash.set(win[Keys.libKey], key, value)
  return getGlobal(key)
}

/**
 * Retrieves a value by key from internal library storage
 * @param {String} key Path to get, utilizing `lodash.get`
 * @returns {any} Value from or undefined if not set
 * @see https://lodash.com/docs/4.17.15#get
 */
export function getGlobal(key, defaultValue) {
  return lodash['get'](win[Keys.libKey], key, defaultValue)
}

/**
 * Deletes a global key from globalThis
 * @param {String} key Property to destroy
 * @returns {void}
 */
export function deleteGlobal(key) {
  delete win[Keys.libKey][key]
}

/**
 * Load the Vue library from globalThis, if available. Throws an error if not defined unless
 * the `options.silent` boolean is provided.
 * @param {object} options
 * @param {boolean} options.silent Silence lookup exceptions if library cannot be found
 * @returns {Vue} An instance of Vue, or a falsy value indicating the library is not loaded
 */
export function Vue({ silent = false } = {}) {
  let vue = win[Keys.vueModuleKey]
  if (vue && Reflect.has(vue, 'devtools') === false) vue = null
  if (!vue && !silent)
    throw new Error('Vue is not loaded on window global; check VueLoader:Get for issues')
  return vue
}

/**
 * Load the VueUse library from globalThis, if available. Throws an error if not defined unless
 * the `options.silent` boolean is provided.
 * @param {object} options
 * @param {boolean} options.silent Silence lookup exceptions if library cannot be found
 * @returns {VueUse} An instance of VueUse, or a falsy value indicating the library is not loaded
 */
export function VueUse({ silent = false } = {}) {
  let vueUse = win[Keys.vueUseModuleKey]
  if (!vueUse && !silent)
    throw new Error('VueUse is not loaded on window global; check AppRoot:loadDeps for issues')
  return vueUse
}

/**
 * Load the Mitt library from globalThis, if available. Throws an error if not defined unless
 * the `options.silent` boolean is provided.
 * @param {object} options
 * @param {boolean} options.silent Silence lookup exceptions if library cannot be found
 * @returns {Mitt} An instance of Mitt, or a falsy value indicating the library is not loaded
 */
export function Mitt({ silent = false } = {}) {
  let mitt = getGlobal('Mitt')
  if (!mitt && !silent)
    throw new Error('Mitt is not loaded on window global; check MittLoader:Get for issues')
  return mitt
}

//
//
// EXCEPTIONS /////////////
// -----------------------------------------
// --------------------------------------------------------------

/**
 * Processing exception, most often originating from SCSS compiler usage in `ComponentManager`.
 * Signifies an issue when preparing components for injection into `bbVue.rootApp`
 */
export class ProcessingException {
  constructor(step, originalError) {
    this.step = step
    this.originalError = originalError
  }

  toString() {
    return `ERROR: [ProcessingException] Failure during '${this.step}' processing\n${
      this.originalError?.formatted || toJson(this.originalError)
    }`
  }
}

/**
 * Component validation exception thrown by `AppFactory`.
 * Signifies an issue with components being provided to `AppFactory` by a consumer app definition.
 */
export class ComponentValidationException {
  constructor(message, cmpDef) {
    this.message = message
    this.componentDefinition = cmpDef
  }

  toString() {
    return `ERROR: [ComponentValidationException] ${this.message}\n${toJson(
      this.componentDefinition
    )}`
  }
}

// APP TRAVERSAL /////////////
// -----------------------------------------
// --------------------------------------------------------------

/**
 * Walk the Vue VNode tree and find the closest parent consumer root mount (CRM)
 * @param {componentInstanceVm} startingVm
 * The view-model / `this` binding from the component where the search originates
 * @returns {crmInstanceVm | null} The closest CRM instance or null
 */
export function getClosestCrm(startingVm) {
  let consumerRoot = null
  let parent = startingVm.$parent
  while (parent && !consumerRoot) {
    if (parent.$options.__consumerRoot === true) {
      consumerRoot = parent
    }
    parent = parent.$parent
  }
  return consumerRoot
}

// GENERAL FUNCTIONS /////////////
// -----------------------------------------
// --------------------------------------------------------------

/**
 * Cleanup an error string
 * @param {String} error Error string to cleanup
 * @returns Removes odd internal delimiters and other noisy chars from a BitBurner error
 */
export function cleanupError(error) {
  return String(error)
    .replace('|DELIMITER|', '')
    .replaceAll('|DELIMITER|', ' » ')
    .replaceAll('<br>', '')
    .replaceAll('Stack:', '')
}

/**
 * Wait for ms then continue
 * @param {Number} ms Millis to wait
 * @returns {Promise<void>}
 */
export async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms)
  })
}

/**
 * Transparent tag expression to support VSCode tooling on template literals
 * @param {String} passThrough
 * @returns {String} untouchedString
 */
export function scss() {
  return templatePassthrough(...arguments)
}

/**
 * Transparent tag expression to support VSCode tooling on template literals
 * @param {String} passThrough
 * @returns {String} untouchedString
 */
export function css() {
  return templatePassthrough(...arguments)
}

/**
 * Transparent tag expression to support VSCode tooling on template literals
 * @param {String} passThrough
 * @returns {String} untouchedString
 */
export function html() {
  return templatePassthrough(...arguments)
}

/**
 * Transparent tag expression; reconstructs provided template string with no changes
 * @param {Array} strings
 * @param  {...any} values
 * @returns {String}
 */
function templatePassthrough(strings, ...values) {
  let str = ''
  strings.forEach((string, i) => {
    str += string + (values[i] || '')
  })
  return str
}

/**
 * Attempts to convert a value to string using `lodash.toString`,
 * and then trim the string with `lodash.trim`
 * @param {any} value Value to coerce to string
 * @returns {string} value
 */
export function toStr(value) {
  return lodash.trim(lodash.toString(value))
}

/**
 * Attempts to decern a given value's "blankness" via:
 * - `lodash.isNil` and
 * - `lodash.isEmpty`
 * @param {any} value Value to be checked for blankness
 * @returns {boolean} Is value blank
 */
export function isBlank(value) {
  if (lodash.isNil(value)) return true
  if (lodash.isString(value) && lodash.isEmpty(value)) return true
  return lodash.isEmpty(value)
}

/**
 * Attempt to convert an object to JSON via `JSON.stringify`, or fallback
 * to a more robust JSON stringifier if needed
 * @param {any} value
 * @returns {String} result
 */
export function toJson(value) {
  try {
    return JSON.stringify(value, null, '  ')
  } catch (error) {
    try {
      return toJsonSafe(value, 4, 4, '  ')
    } catch (error) {
      return '[COULD NOT SERIALIZE] ' + value
    }
  }
}

/**
 * Attempt to convert a string to it's parsed JSON result
 * @param {any} value
 * @returns {any | null} resultOrNull
 */
export function fromJson(value) {
  try {
    return JSON.parse(value)
  } catch (error) {
    console.error(`bb-vue: Could not parse JSON string: ${value}`)
    return null
  }
}

/**
 * @param {String} value
 */
export function uppercaseFirstLetter(value) {
  return String(value).charAt(0).toUpperCase() + String(value).slice(1)
}

/**
 * Returns the JSON representation of an object.
 *
 * @param {value} object the object
 * @param {number} objectMaxDepth for objects, the maximum number of times to recurse into descendants
 * @param {number} arrayMaxLength for arrays, the maximum number of elements to enumerate
 * @param {string} indent the string to use for indentation
 * @return {string} the JSON representation
 */
const toJsonSafe = function (object, objectMaxDepth, arrayMaxLength, indent) {
  'use strict'

  /**
   * Escapes control characters, quote characters, backslash characters and quotes the string.
   *
   * @param {string} string the string to quote
   * @returns {String} the quoted string
   */
  function quote(string) {
    escapable.lastIndex = 0
    var escaped
    if (escapable.test(string)) {
      escaped = string.replace(escapable, function (a) {
        var replacement = replacements[a]
        if (typeof replacement === 'string') return replacement
        // Pad the unicode representation with leading zeros, up to 4 characters.
        return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4)
      })
    } else escaped = string
    return '"' + escaped + '"'
  }

  /**
   * Returns the String representation of an object.
   *
   * Based on <a href="https://github.com/Canop/JSON.prune/blob/master/JSON.prune.js">https://github.com/Canop/JSON.prune/blob/master/JSON.prune.js</a>
   *
   * @param {string} path the fully-qualified path of value in the JSON object
   * @param {type} value the value of the property
   * @param {string} cumulativeIndent the indentation to apply at this level
   * @param {number} depth the current recursion depth
   * @return {String} the JSON representation of the object, or "null" for values that aren't valid
   * in JSON (e.g. infinite numbers).
   */
  function toString(path, value, cumulativeIndent, depth) {
    switch (typeof value) {
      case 'string':
        return quote(value)
      case 'number': {
        // JSON numbers must be finite
        if (isFinite(value)) return String(value)
        return 'null'
      }
      case 'boolean':
        return String(value)
      case 'object': {
        if (!value) return 'null'
        var valueIndex = values.indexOf(value)
        if (valueIndex !== -1) return 'Reference => ' + paths[valueIndex]
        values.push(value)
        paths.push(path)
        if (depth > objectMaxDepth) return '...'

        // Make an array to hold the partial results of stringifying this object value.
        var partial = []

        // Is the value an array?
        var i
        if (Object.prototype.toString.apply(value) === '[object Array]') {
          // The value is an array. Stringify every element
          var length = Math.min(value.length, arrayMaxLength)

          // Whether a property has one or multiple values, they should be treated as the same
          // object depth. As such, we do not increment the object depth when recursing into an
          // array.
          for (i = 0; i < length; ++i) {
            partial[i] = toString(
              path + '.' + i,
              value[i],
              cumulativeIndent + indent,
              depth,
              arrayMaxLength
            )
          }
          if (i < value.length) {
            // arrayMaxLength reached
            partial[i] = '...'
          }
          return '\n' + cumulativeIndent + '[' + partial.join(', ') + '\n' + cumulativeIndent + ']'
        }

        // Otherwise, iterate through all of the keys in the object.
        for (var subKey in value) {
          if (Object.prototype.hasOwnProperty.call(value, subKey)) {
            var subValue
            try {
              subValue = toString(
                path + '.' + subKey,
                value[subKey],
                cumulativeIndent + indent,
                depth + 1
              )
              partial.push(quote(subKey) + ': ' + subValue)
            } catch (e) {
              // this try/catch due to forbidden accessors on some objects
              if (e.message) subKey = e.message
              else subKey = 'access denied'
            }
          }
        }
        var result = '\n' + cumulativeIndent + '{\n'
        for (i = 0; i < partial.length; ++i)
          result += cumulativeIndent + indent + partial[i] + ',\n'
        if (partial.length > 0) {
          // Remove trailing comma
          result = result.slice(0, result.length - 2) + '\n'
        }
        result += cumulativeIndent + '}'
        return result
      }
      default:
        return 'null'
    }
  }

  if (indent === undefined) indent = '  '
  if (objectMaxDepth === undefined) objectMaxDepth = 0
  if (arrayMaxLength === undefined) arrayMaxLength = 50
  // Matches characters that must be escaped

  // prettier-ignore
  // eslint-disable-next-line
  var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g

  // The replacement characters
  var replacements = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '"': '\\"',
    '\\': '\\\\',
  }
  // A list of all the objects that were seen (used to avoid recursion)
  var values = []
  // The path of an object in the JSON object, with indexes corresponding to entries in the
  // "values" variable.
  var paths = []
  return toString('root', object, '', 0)
}

/**
 * Return a formatted representation of the monetary amount using scale sympols (e.g. $6.50M)
 * @param {number} num - The number to format
 * @param {number=} maxSignificantFigures - (default: 6) The maximum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} maxDecimalPlaces - (default: 3) The maximum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 **/
export function formatMoney(num, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
  let numberShort = formatNumberShort(num, maxSignificantFigures, maxDecimalPlaces)
  return num >= 0 ? '$' + numberShort : numberShort.replace('-', '-$')
}

const symbols = ['', 'k', 'm', 'b', 't', 'q', 'Q', 's', 'S', 'o', 'n', 'e33', 'e36', 'e39']

/**
 * Return a formatted representation of the monetary amount using scale sympols (e.g. 6.50M)
 * @param {number} num - The number to format
 * @param {number=} maxSignificantFigures - (default: 6) The maximum significant figures you wish to see (e.g. 123, 12.3 and 1.23 all have 3 significant figures)
 * @param {number=} maxDecimalPlaces - (default: 3) The maximum decimal places you wish to see, regardless of significant figures. (e.g. 12.3, 1.2, 0.1 all have 1 decimal)
 **/
export function formatNumberShort(num, maxSignificantFigures = 6, maxDecimalPlaces = 3) {
  for (
    var i = 0, sign = Math.sign(num), num = Math.abs(num);
    num >= 1000 && i < symbols.length;
    i++
  )
    num /= 1000
  return (
    (sign < 0 ? '-' : '') +
    num.toFixed(
      Math.max(
        0,
        Math.min(maxDecimalPlaces, maxSignificantFigures - Math.floor(1 + Math.log10(num)))
      )
    ) +
    symbols[i]
  )
}

/**
 * Elapsed time between two dates, or a number of seconds
 * @param {number} timeStart Defaults to 0
 * @param {number} timeEnd Defaults to 0
 * @returns {string} Elapsed time in human-friendly format
 */
export function timeDiff(timeStart = 0, timeEnd = 0) {
  let diff
  if (timeStart && timeEnd) {
    diff = timeEnd - timeStart
  } else {
    diff = timeStart * 1000
  }
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

export function formatRam(gb) {
  const sizes = ['GB', 'TB', 'PB']
  const marker = 1000
  const precision = 2
  gb = parseInt(gb) || 0
  if (gb == 0) return 'n/a'
  const i = parseInt(Math.floor(Math.log(gb) / Math.log(marker)))
  if (i == 0) return gb + sizes[i]
  return (gb / Math.pow(marker, i)).toFixed(precision) + sizes[i]
}

export function mapOrder(array, myorder, key, catchAll) {
  var order = myorder.reduce((r, k, i) => ((r[k] = i + 1), r), {})
  const theSort = array.sort(
    (a, b) => (order[a[key]] || order[catchAll]) - (order[b[key]] || order[catchAll])
  )
  return theSort
}
