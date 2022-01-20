// prettier-ignore
import { doc, toStr, win } from '/bb-vue/lib.js'

export default class SassLoader {
  static #moduleGlobalKey = 'Sass'

  static async Fetch() {
    let module = this.#getModule()
    if (!this.#isValidModule(module)) {
      await this.#loadSassModule()
      module = this.#getModule()
    }
    if (!this.#isValidModule(module)) {
      throw new Error(`SassLoader could not load module in Fetch()`)
    }

    return this.#wrapModule(module)
  }

  static #loadSassModule() {
    return new Promise((resolve, reject) => {
      this.#doDefineHack()

      const onScriptLoad = (() => {
        // console.log('sass:load')
        const module = this.#getModule()
        if (this.#isValidModule(module)) {
          resolve(module)
          // console.log('sass:loadResolve')
        } else {
          reject()
          console.error('bb-vue: sass:loadReject', this)
          throw new Error('SassLoader could not load module in #loadSassModule()')
        }
        this.#undoDefineHack()
      }).bind(this)

      let sassJSScript = doc.createElement('script')
      sassJSScript.type = 'text/javascript'
      sassJSScript.src = 'https://cdn.jsdelivr.net/npm/sass.js@0.11.1/dist/sass.sync.js'
      sassJSScript.onload = onScriptLoad
      sassJSScript.onerror = reject

      doc.head.appendChild(sassJSScript)
    })
  }

  static async #compileAsyncWrapper(module, rawScss, scssCompilerOptions, ...args) {
    let compilerOptionsMerged = Object.assign({ style: module.style.expanded }, scssCompilerOptions)
    return new Promise((resolve, reject) => {
      // console.log('compile', rawScss)
      module.compile(
        rawScss,
        compilerOptionsMerged,
        (compileResult) => {
          if (compileResult.status !== 0) {
            reject(compileResult)
            // console.log('compile:reject', compileResult)
          } else {
            resolve(toStr(compileResult.text))
            // console.log('compile:resolve', compileResult.text)
          }
        },
        ...args
      )
    })
  }

  static #getModule() {
    return win[this.#moduleGlobalKey]
  }

  static #wrapModule(module) {
    if (!this.#isValidModule(module))
      throw new Error('SassLoader cannot wrap invalid module', module)
    module.compileAsync = async (rawCss, scssOptions, ...args) =>
      await this.#compileAsyncWrapper(module, rawCss, scssOptions, ...args)
    return module
  }

  static #isValidModule(module) {
    return module && module.compile
  }

  static #doDefineHack() {
    if (win.define) {
      win._defineBak = win.define
      win.define = undefined
    }
  }

  static #undoDefineHack() {
    if (win._defineBak) {
      win.define = win._defineBak
    }
  }
}
