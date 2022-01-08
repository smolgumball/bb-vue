//
//
// NOTE:
// Ideally some of these files would be in separate resource folders,
// but I've been running into circular reference issues in-game.
// -----------------------------------------
//--------------------------------------------------------------

//
//
// CONSTANTS /////////////
// -----------------------------------------
// --------------------------------------------------------------

export const Keys = Object.freeze({
  libKey: 'bbVue',
  vueModuleKey: 'Vue',
  vueUseModuleKey: 'VueUse',
  mittModuleKey: 'Mitt',
  rootAppKey: 'rootApp',
  globalBusKey: 'rootBus',
  globalConfigKey: 'appFactoryConfig',
})

export const ReplacementTokens = Object.freeze({
  appId: '__APP_ID__',
  componentName: '__CMP_NAME__',
})

//
//
// GLOBALS MANAGEMENT /////////////
// -----------------------------------------
// --------------------------------------------------------------

export const win = globalThis['window']
export const doc = globalThis['document']
export const lodash = win._

if (!win[Keys.libKey]) win[Keys.libKey] = {}

/**
 * Use sparingly! Sets a value by key to internal library storage.
 * @param {String} key Path to set, utilizing lodash#set.
 * @param {any} value
 * * @see https://lodash.com/docs/4.17.15#set
 */

export function setGlobal(key, value) {
  if (key == Keys.vueModuleKey) {
    // HACK: Ensure Vue is loaded where certain iife modules expect it
    return lodash.set(globalThis, Keys.vueModuleKey, value)
  } else if (key == Keys.vueUseModuleKey) {
    // HACK: Ensure VueUse is loaded where certain iife modules expect it
    return lodash.set(globalThis, Keys.vueUseModuleKey, value)
  } else {
    return lodash.set(win[Keys.libKey], key, value)
  }
}

/**
 * Use sparingly! Retrieves a value by key from internal library storage.
 * @param {String} key Path to get, utilizing lodash#get.
 * @returns {any | undefined} Value from or undefined if not set
 * @see https://lodash.com/docs/4.17.15#get
 */
export function getGlobal(key, defaultValue) {
  if (key == Keys.vueModuleKey) {
    // HACK: Ensure Vue is retrieved from where certain iife modules expect it
    return lodash['get'](globalThis, Keys.vueModuleKey)
  } else if (key == Keys.vueUseModuleKey) {
    // HACK: Ensure VueUse is retrieved from where certain iife modules expect it
    return lodash['get'](globalThis, Keys.vueUseModuleKey)
  } else {
    return lodash['get'](win[Keys.libKey], key, defaultValue)
  }
}

export function setGlobalAppFactoryConfig(value) {
  setGlobal(Keys.globalConfigKey, value)
}

export function getGlobalAppFactoryConfig() {
  return getGlobal(Keys.globalConfigKey, {})
}

export function registerNewApp(appDef) {
  return getGlobal(Keys.rootAppKey)?._instance?.ctx?.registerApp(appDef)
}

//
//
// EXCEPTIONS /////////////
// -----------------------------------------
// --------------------------------------------------------------

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

export function nearestConsumerRootMount(startingVm) {
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

// FUNCTIONS /////////////
// -----------------------------------------
// --------------------------------------------------------------

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

export function toStr(value) {
  return lodash.trim(lodash.toString(value))
}

export function isBlank(value) {
  if (lodash.isNil(value)) return true
  if (lodash.isString(value) && lodash.isEmpty(value)) return true
  return lodash.isEmpty(value)
}

/**
 * Attempt to convert an object to JSON & fallback to a more robust JSON stringifier if needed
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
