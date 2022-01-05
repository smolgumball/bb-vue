export const weendow = globalThis['window']
export const doocument = globalThis['document']
export const lodash = globalThis['window']._

const globalNamespace = '_smolGumball'

if (!weendow[globalNamespace]) weendow[globalNamespace] = {}
export const projectGlobals = weendow[globalNamespace]

/**
 * @param {String} key
 * @param {any} value
 */
export function setProjectGlobal(key, value) {
  lodash.set(weendow[globalNamespace], key, value)
}

/**
 * @param {String} key
 */
export function getProjectGlobal(key) {
  lodash.get(weendow[globalNamespace], key)
}

/**
 * @param {Object} data
 */
export function updateStore(data) {
  if (projectGlobals.store) {
    projectGlobals.store.update(data)
  } else {
    throw new Error('updateStore failed; store not found')
  }
}

/**
 * @param {String} type
 * @param {Object} data
 */
export function emitEvent(type, data) {
  if (projectGlobals.eventBus) {
    projectGlobals.eventBus.emit(type, data)
  } else {
    throw new Error('emitEvent failed; eventBus not found')
  }
}

/**
 * @param {String} type
 * @param {Function} handler
 */
export function registerEvent(type, handler) {
  if (projectGlobals.eventBus) {
    projectGlobals.eventBus.on(type, handler)
  } else {
    throw new Error('registerEvent failed; eventBus not found')
  }
}

/**
 * @param {Boolean} isVisible
 */
export function setAppVisible(isVisible) {
  let body = doocument.body
  let areStylesPresent = Boolean(doocument.getElementById('__sglStyle'))

  if (!areStylesPresent) {
    body.insertAdjacentHTML(
      'afterbegin',
      html`
        <style id="__sglStyle" type="text/css">
          #${projectGlobals.ui?.rootIds?.wrap} {
            z-index: 1500;
            position: relative;
            transition: opacity 0.35s ease;
          }

          body.__sglHidden #${projectGlobals.ui?.rootIds?.wrap} {
            pointer-events: none;
            opacity: 0;
          }
        </style>
      `
    )
  }

  body.classList.toggle('__sglHidden', !isVisible)
}

/**
 * @param {NS} ns
 * @returns hostnames
 */
export function deepScan(ns) {
  const hostnames = ['home']
  for (const hostname of hostnames) {
    hostnames.push(...ns.scan(hostname).filter((host) => !hostnames.includes(host)))
  }

  return hostnames
}

/**
 * @param {Number} timeStart
 * @param {Number} timeEnd
 */
export function timeDiff(timeStart, timeEnd, options = { verbose: false }) {
  let diff = Math.floor(timeEnd) - Math.floor(timeStart)
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
  if (ms > 0 && (!secs || options.verbose)) {
    toRet.push(`${ms}ms`)
  }
  return toRet.join(' ')
}

export function css() {
  return templatePassthrough(...arguments)
}

export function html() {
  return templatePassthrough(...arguments)
}

/**
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
 * @param {any} value
 * @returns {any} result
 */
export function fromJson(value) {
  try {
    return JSON.parse(value)
  } catch (error) {
    console.error(`Could not parse JSON string: ${value}`)
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
 * @param {Object} eventClone
 */
export function deepTruncate(value) {
  const numberToKeep = 10

  if (value && isClass(value)) {
    return `[Instance of ${value?.constructor?.name}]`
  }

  let valueClone = lodash.cloneDeep(value)
  if (lodash.isArray(valueClone)) {
    // Discard every array element after first X (order guaranteed)
    if (valueClone.length > numberToKeep) {
      valueClone = valueClone.slice(0, numberToKeep + 1).map((val) => deepTruncate(val))
      valueClone.push('...')
    }
    return lodash.compact(valueClone)
  } else if (lodash.isPlainObject(valueClone)) {
    // Delete every key after first X (order not guaranteed)
    let hasDeleted
    Object.keys(valueClone)
      .slice(numberToKeep)
      .forEach((key) => {
        delete valueClone[key]
        hasDeleted = true
      })
    Object.keys(valueClone).forEach((key) => {
      valueClone[key] = deepTruncate(valueClone[key])
    })
    if (hasDeleted) valueClone['...'] = '...'
    return valueClone
  }

  return valueClone

  function isClass(obj) {
    const isCtorClass = obj.constructor && obj.constructor.toString().substring(0, 5) === 'class'
    if (obj.prototype === undefined) {
      return isCtorClass
    }
    const isPrototypeCtorClass =
      obj.prototype.constructor &&
      obj.prototype.constructor.toString &&
      obj.prototype.constructor.toString().substring(0, 5) === 'class'
    return isCtorClass || isPrototypeCtorClass
  }
}

export class Log {
  #ns
  #silence
  #outputStrategy

  static outputStrategies = {
    console: 'console',
    terminal: 'terminal',
    vueEvent: 'vueEvent',
  }
  static levels = {
    info: 'info',
    error: 'error',
  }

  /**
   * @param {NS} ns
   * @param {{ silence: Boolean, outputStrategy: String }} opts
   */
  constructor(ns, opts) {
    let options = {
      silence: false,
      outputStrategy: Log.outputStrategies.console,
      ...opts,
    }

    this.#ns = ns
    this.#silence = options.silence
    this.#outputStrategy = options.outputStrategy
  }

  /**
   * @param {String} msg
   */
  info(msg) {
    this.#write(`INFO: ${msg}`, Log.levels.info)
  }

  /**
   * @param {String} msg
   */
  error(msg) {
    this.#write(`ERROR: ${msg}`, Log.levels.error)
  }

  /**
   * @param {String} msg
   * @param {String} level
   */
  #write(msg, level) {
    if (this.#silence) return
    if (this.#outputStrategy == Log.outputStrategies.console) {
      let consoleMethod = level == Log.levels.info ? 'log' : 'error'
      console[consoleMethod](msg)
    }
    if (this.#outputStrategy == Log.outputStrategies.terminal) {
      this.#ns.tprint(msg)
    }
    if (this.#outputStrategy == Log.outputStrategies.vueEvent) {
      emitEvent(`log${uppercaseFirstLetter(level)}`, { message: msg })
    }
  }
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
export const toJsonSafe = function (object, objectMaxDepth, arrayMaxLength, indent) {
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
  var escapable =
    /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g
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
