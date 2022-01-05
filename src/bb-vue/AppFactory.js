import {
  doc,
  getConfig,
  getGlobal,
  html,
  isBlank,
  lodash,
  registerNewApp,
  setGlobal,
  toStr,
} from '/bb-vue/lib.js'

import ComponentManager from '/bb-vue/ComponentManager.js'
import MittLoader from '/bb-vue/MittLoader.js'
import SassLoader from '/bb-vue/SassLoader.js'
import VueLoader from '/bb-vue/VueLoader.js'

import { ComponentTiers } from '/bb-vue/components/_resources.js'
import Window from '/bb-vue/components/Window.js'
import WindowManager from '/bb-vue/components/WindowManager.js'
import AppTray from '/bb-vue/components/AppTray.js'
import Button from '/bb-vue/components/Button.js'
import JsonDisplay from '/bb-vue/components/JsonDisplay.js'
import Tabs from '/bb-vue/components/Tabs.js'
import AppRoot from '/bb-vue/components/AppRoot.js'

const CreateOrGetRootVueApp = async (ns, Vue, Sass, Mitt, forceReload) => {
  AppFactory.CatchAsync(ns, async () => {
    const rootConfig = {
      appId: 'bb-vue-root',
    }

    let existingRootDom = doc.getElementById(rootConfig.appId)
    if (!forceReload && existingRootDom && getGlobal('rootApp')?._instance) {
      return getGlobal('rootApp')
    } else if (existingRootDom) {
      existingRootDom.remove()
    }

    let rootComponentsManager = new ComponentManager(
      rootConfig,
      Sass,
      AppRoot.scssResources,
      ComponentTiers.library
    )

    let rootApp
    rootComponentsManager.add(AppRoot, Window, WindowManager, AppTray, Button, JsonDisplay, Tabs)
    await rootComponentsManager.processAll()

    let processedLibraryRoot = rootComponentsManager.processedLibraryRoot
    processedLibraryRoot.__finalStyles = rootComponentsManager.gatherAllProcessedStyles()
    rootApp = Vue.createApp(processedLibraryRoot)

    let appBus = Mitt.createBus()
    rootApp.config.globalProperties.$__app = rootApp
    rootApp.config.globalProperties.$store = new Vue.reactive({})
    rootApp.config.globalProperties.$bus = appBus
    rootApp.config.globalProperties.$send = appBus.emit
    rootApp.config.globalProperties.$listen = appBus.on

    rootComponentsManager.registerWithVueApp(rootApp)

    doc.body.insertAdjacentHTML(
      'afterbegin',
      // prettier-ignore
      html`
        <div id="${rootConfig.appId}" bbv-root></div>
      `
    )

    rootApp.mount(`#${rootConfig.appId}`)
    setGlobal('rootApp', rootApp)

    return rootApp
  })
}

//

export default class AppFactory {
  #Vue
  #Mitt
  #Sass

  #ns
  #appId
  #appConfig
  #defaultAppConfig

  #scssResources
  #rootComponent
  #componentsInQueue

  #started

  constructor(appId, ns) {
    AppFactory.Catch(ns, () => {
      if (isBlank(appId)) {
        throw new Error(
          `Every AppFactory needs a unique appId! ` +
            `Try using \`crypto.randomUUID()\` if you can't think of one.`
        )
      }

      if (isBlank(ns) || !(ns.tprint || ns.sleep || ns.exit)) {
        throw new Error(
          `Every AppFactory needs a unique reference to the ns object! ` +
            `Try sending the ns object from the script where you're creating this AppFactory.`
        )
      }

      this.#appId = toStr(appId)
      this.#ns = ns
      this.#started = false
      this.#componentsInQueue = new Set()
      this.configure()

      return this
    })
  }

  configure(instanceConfig = {}) {
    AppFactory.Catch(this.#ns, () => {
      this.#validateOnlyOneStart()
      let globalConfig = { ...getConfig() }
      this.#defaultAppConfig = {
        showTips: true,
        forceReload: false,
      }
      this.#appConfig = Object.assign({}, this.#defaultAppConfig, globalConfig, instanceConfig)
      this.#appConfig.appId = this.#appId

      return this
    })
  }

  setRootComponent(componentDefinition) {
    AppFactory.Catch(this.#ns, () => {
      this.#validateOnlyOneStart()

      let cmpDef = ComponentManager.Validate(componentDefinition)
      cmpDef.__consumerRoot = true
      this.#rootComponent = cmpDef
      this.#componentsInQueue.add(cmpDef)

      return this
    })
  }

  addComponents(...args) {
    AppFactory.Catch(this.#ns, () => {
      this.#validateOnlyOneStart()

      if (isBlank(args)) {
        throw new Error('Please provide one or more components to add')
      }

      for (let cmpDef of args) {
        cmpDef = ComponentManager.Validate(cmpDef)
        this.#componentsInQueue.add(cmpDef)
      }

      return this
    })
  }

  addScssResources(scssResources) {
    AppFactory.Catch(this.#ns, () => {
      this.#validateOnlyOneStart()

      if (!lodash.isString(scssResources)) {
        throw new TypeError('SCSS resources added to AppFactory must be of type String')
      }
      this.#scssResources = toStr(scssResources)

      return this
    })
  }

  async start() {
    AppFactory.CatchAsync(this.#ns, () => {
      this.#validateOnlyOneStart()
      this.#validateStart()

      await this.#runLoaders()

      let rootVueApp = await CreateOrGetRootVueApp(
        this.#ns,
        this.#Vue,
        this.#Sass,
        this.#Mitt,
        this.#appConfig.forceReload
      )

      let componentManager = new ComponentManager(
        this.#appConfig,
        this.#Sass,
        this.#scssResources,
        ComponentTiers.consumer
      )

      try {
        componentManager.add(...this.#componentsInQueue)
        await componentManager.processAll()
        componentManager.registerWithVueApp(rootVueApp)
      } catch (error) {
        console.error(error.toString(), error.originalError)
        this.#ns.tprint(error.toString())
        this.#ns.exit()
      }

      let processedConsumerRoot = componentManager.processedConsumerRoot
      processedConsumerRoot.__finalStyles = componentManager.gatherAllProcessedStyles()

      registerNewApp(processedConsumerRoot)

      this.#started = true

      if (this.#appConfig.showTips) {
        this.#ns.tprint(
          `\n\n📦 Your bb-vue app (#${
            this.#appConfig.appId
          }) is now mounted!\n\n🧰 Use the Debug -> Activate menu to open the BitBurner Developer Tools.\n👓 In the Elements tab, you should find your app at the top of the <body> tag.\n\n🎉 Have fun!\n\nP.S. If you're sick of seeing this message, add \`showTips: false\` to your app's configuration object.\n\n`
        )
      }

      return rootVueApp
    })
  }

  async #runLoaders() {
    AppFactory.CatchAsync(this.#ns, () => {
      this.#Vue = await VueLoader.Get()
      this.#Mitt = await MittLoader.Get()
      this.#Sass = await SassLoader.Get()
    })
  }

  #validateStart() {
    AppFactory.Catch(this.#ns, () => {
      if (this.#componentsInQueue.size < 1) {
        throw new Error('You must add at least one component to the AppFactory before starting it')
      }

      if (isBlank(this.#rootComponent)) {
        throw new Error(
          'You must mark one component as your root component using AppFactory.setRootComponent'
        )
      }
    })
  }

  #validateOnlyOneStart() {
    AppFactory.Catch(this.#ns, () => {
      if (this.#started === true) {
        throw new Error(
          'AppFactory can only be started once! You should store a reference to the AppInstance that is returned from AppFactory.start'
        )
      }
    })
  }

  static Catch(ns, executeFn) {
    if (!executeFn) throw new TypeError('executeFn must be provided')

    try {
      return executeFn()
    } catch (error) {
      return AppFactory.HandleException(ns, error)
    }
  }

  static async CatchAsync(ns, executeFn) {
    if (!executeFn) throw new TypeError('executeFn must be provided')

    try {
      return await executeFn()
    } catch (error) {
      return AppFactory.HandleException(ns, error)
    }
  }

  static HandleException(ns, error) {
    console.error(error.toString(), error.originalError)
    ns.tprint(error.toString())
    ns.exit()
  }
}
