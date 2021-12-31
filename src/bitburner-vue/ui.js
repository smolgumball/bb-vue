import { html, weendow, doocument, emitEvent, projectGlobals, setProjectGlobal } from '/bitburner-vue/lib.js'
import AppRoot from '/bitburner-vue/components/AppRoot.js'
import StoreDisplay from '/bitburner-vue/components/StoreDisplay.js'
import RecentEvents from '/bitburner-vue/components/RecentEvents.js'
import CommandPalette from '/bitburner-vue/components/CommandPalette.js'

const UIComponents = [AppRoot, StoreDisplay, RecentEvents, CommandPalette]

export default class UI {
  #ns
  vueApp
  rootIds
  vueAppId = 'vueApp'

  /**
   * @param {NS} ns
   */
  constructor(ns) {
    this.#ns = ns
    this.rootIds = {
      wrap: `${this.vueAppId}-wrap`,
      app: `${this.vueAppId}`,
    }

    setProjectGlobal('ui', this)
  }

  async init() {
    // Boot Vue app
    let createReport = await this.createVueApp()
    this.vueApp = createReport.app

    emitEvent('init:ui', {
      root: createReport.root,
      components: createReport.components,
    })

    return this
  }

  async createVueApp() {
    // Unmount stale Vue app if detected
    this.unmountVueApp()

    // Create Vue app + persist in _vueApp global
    if (!projectGlobals.Modules?.Vue) throw new Error('Vue is not loaded; check VueLoader usage')
    let app = projectGlobals.Modules.Vue.createApp({})

    // Register components with Vue app
    let components = UIComponents.map((cmp) => {
      app.component(cmp.name, cmp)
      return cmp
    })

    // Collect app styles and inject app root container
    this.injectAppRootWithStyles(components)

    // Mount Vue app
    app.mount(`#${this.rootIds.app}`)

    // Add SCSS compiler for in-browser compilation (kekw)
    this.initScssCompiler()

    return {
      app,
      root: `#${this.rootIds.wrap}`,
      components: components.map((x) => x.name),
    }
  }

  unmountVueApp() {
    let app = projectGlobals.ui?.vueApp
    try {
      if (app && app._instance) {
        app.unmount()
      }
    } catch (error) {
      console.log(`Issue unmounting Vue app`, error)
    }

    doocument.querySelectorAll(`#${this.rootIds.wrap}`).forEach((x) => x.remove())
  }

  injectAppRootWithStyles(components) {
    let appStyles = components.map((cmp) => (cmp.style ? cmp.style.trim() : ''))
    let globalStyles = components.map((cmp) => (cmp.globalStyle ? cmp.globalStyle.trim() : ''))
    let body = doocument.querySelector('body')

    body.insertAdjacentHTML(
      'afterbegin',
      html`
        <div id="${this.rootIds.wrap}">
          <div id="${this.rootIds.app}">
            <app-root />
          </div>
          <style type="text/scss">
            ${globalStyles.join('\n')}
            .app_root {
              ${appStyles.join('\n')}
            }
          </style>
        </div>
      `
    )
  }

  initScssCompiler() {
    if (typeof weendow !== 'undefined' && typeof doocument !== 'undefined') {
      if (typeof Sass === 'undefined' || typeof Sass.compile !== 'function') {
        var sassJSScript = doocument.createElement('script')
        sassJSScript.type = 'text/javascript'
        sassJSScript.src = 'https://cdn.jsdelivr.net/npm/sass.js@0.11.1/dist/sass.sync.js'
        sassJSScript.onload = this.findAndConvertTags.bind(this)

        // Monkey patch `window.define` to ensure sass installs properly
        weendow._defineBak = weendow.define
        weendow.define = undefined
        doocument.head.appendChild(sassJSScript)
      } else {
        this.findAndConvertTags()
      }

      if (
        typeof weendow !== 'undefined' &&
        weendow !== null &&
        typeof Sass !== 'undefined' &&
        typeof Sass.compile === 'function'
      ) {
        setTimeout(this.findAndConvertTags.bind(this), 0)
      }
    }
  }

  findAndConvertTags() {
    // Restore `window.define`
    weendow.define = weendow._defineBak
    var sassTags = doocument.getElementsByTagName('style')
    for (var i = sassTags.length - 1; i >= 0; i--) {
      if (sassTags[i].type.toLowerCase() === 'text/scss' && sassTags[i]._scssCompiled !== true) {
        Sass.compile(sassTags[i].innerHTML, (compiledCSS) => {
          var rawStyle = doocument.createElement('style')
          rawStyle.type = 'text/css'
          rawStyle.innerHTML = compiledCSS.text
          doocument.getElementById(`${this.rootIds.wrap}`).appendChild(rawStyle)
        })
        sassTags[i]._scssCompiled = true
      }
    }
  }

  get reportForEvent() {
    return {
      vueAppId: this.vueApp?._container.id,
    }
  }
}
