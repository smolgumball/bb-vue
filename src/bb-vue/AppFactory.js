// prettier-ignore
import { isBlank, lodash, toStr, toJson, RootApp } from '/bb-vue/lib.js'

import ComponentManager from '/bb-vue/ComponentManager.js'
import MittLoader from '/bb-vue/MittLoader.js'
import SassLoader from '/bb-vue/SassLoader.js'
import VueLoader from '/bb-vue/VueLoader.js'

import ScriptX from '/bb-vue/components/internal/ScriptX.js'

// prettier-ignore
import { default as AppRoot, ComponentLibrary } from '/bb-vue/components/internal/AppRoot.js'

const CreateOrGetRootVueApp = async (Vue, Sass, forceReload = false) => {
  const rootConfig = {
    appId: 'bb-vue-root',
  }

  // console.time('CreateOrGetRootVueApp')

  if (forceReload == true || (RootApp.raw() && !RootApp.instance())) {
    console.debug(`bb-vue: AppFactory found remnants of previous app, doing cleanup`)
    try {
      await RootApp.rootShutdown()
    } catch (error) {
      await RootApp.cleanup()
    }
  } else if (RootApp.raw() && RootApp.instance()) {
    console.debug(`bb-vue: AppFactory found existing app, returning instance`)
    return RootApp.raw()
  }

  console.debug(`bb-vue: AppFactory building new Vue app`)

  let componentManager = new ComponentManager(rootConfig, Sass, AppRoot.scssResources)
  componentManager.add(AppRoot, ...ComponentLibrary)
  await componentManager.processAll()

  let processedLibraryRoot = {
    ...componentManager.processedLibraryRoot,
    __finalStyles: componentManager.gatherAllProcessedStyles(),
  }

  let rootApp
  rootApp = Vue.createApp(processedLibraryRoot)
  rootApp.use(ScriptX)
  componentManager.registerWithVueApp(rootApp)

  await RootApp.addDom(rootConfig.appId)
  rootApp.mount(`#${rootConfig.appId}`)
  RootApp.set(rootApp)

  // console.timeEnd('CreateOrGetRootVueApp')

  return rootApp
}

//

export default class AppFactory {
  #ns
  #appConfig
  #rootComponent
  #componentsInQueue = new Set()
  #mounted = false

  constructor(ns) {
    if (isBlank(ns) || !(ns.tprint || ns.sleep || ns.exit)) {
      throw new Error(
        `Every AppFactory needs a unique reference to the ns object! ` +
          `Try sending the ns object from the script where you're creating this AppFactory.`
      )
    }

    this.#ns = ns
    this.#mounted = false
    this.#componentsInQueue = new Set()

    return this
  }

  async mount({ config = {}, components = [], rootComponent = {} }) {
    this.#configure(config)
    this.#addComponents(components)
    this.#setRootComponent(rootComponent)

    this.#validateStart()
    this.#validateOneMount()

    // console.time('AppFactory:start')

    const { Vue, Sass } = await this.#runLoaders()

    // Mount root app
    let rootVueApp = await CreateOrGetRootVueApp(Vue, Sass, this.#appConfig.forceReload)

    let componentManager = new ComponentManager(
      this.#appConfig,
      Sass,
      [RootApp.appDef().scssResources, this.#appConfig.scssResources].join('\n\n')
    )
    componentManager.add(...this.#componentsInQueue)
    await componentManager.processAll()
    componentManager.registerWithVueApp(rootVueApp)

    let processedConsumerRoot = {
      ...componentManager.processedConsumerRoot,
      __finalStyles: componentManager.gatherAllProcessedStyles(),
    }

    let consumerAppHandleFn = addConsumerRootDef(this.#ns, processedConsumerRoot)

    this.#mounted = true

    if (this.#appConfig.showTips) {
      this.#ns.tprint(
        `\n\n📦 Your bb-vue app (#${
          this.#appConfig.appId
        }) is now mounted!\n\n🧰 Use the Debug -> Activate menu to open the BitBurner Developer Tools.\n👓 In the Elements tab, you should find your app at the top of the <body> tag.\n\n🎉 Have fun!\n\nP.S. If you're sick of seeing this message, add \`showTips: false\` to your app's configuration object.\n\n`
      )
    }

    // console.timeEnd('AppFactory:start')

    return consumerAppHandleFn
  }

  #configure(instanceConfig = {}) {
    if (isBlank(instanceConfig.id)) {
      throw new Error(
        `Every AppFactory needs a unique ID! ` +
          `Try using \`crypto.randomUUID()\` if you can't think of one.`
      )
    }

    let defaultConfig = {
      appId: toStr(instanceConfig.id),
      showTips: true,
      forceReload: false,
      shutdownWithPid: null,
      shutdownRootWithPid: null,
      scssResources: '',
    }

    delete instanceConfig.id
    this.#appConfig = Object.assign(defaultConfig, instanceConfig)

    if (!isBlank(this.#appConfig.scssResources)) {
      if (!lodash.isString(this.#appConfig.scssResources)) {
        throw new TypeError('SCSS resources added to AppFactory must be of type String')
      }
    }
  }

  #addComponents(components) {
    if (!lodash.isArray(components)) {
      throw new Error('Please provide one or more components to add as an array')
    }

    for (let cmpDef of components) {
      cmpDef = ComponentManager.Validate(cmpDef)
      this.#componentsInQueue.add(cmpDef)
    }
  }

  #setRootComponent(componentDefinition = {}) {
    let cmpDef = { ...ComponentManager.Validate(componentDefinition) }
    cmpDef.__consumerRoot = true
    cmpDef.__appId = this.#appConfig.appId
    cmpDef.__uuid = `${cmpDef.name}-${crypto.randomUUID()}`
    cmpDef.__config = this.#appConfig
    this.#rootComponent = cmpDef
    this.#componentsInQueue.add(cmpDef)

    return this
  }

  async #runLoaders() {
    const [Vue, Mitt, Sass] = await Promise.all([
      VueLoader.Fetch(),
      MittLoader.Fetch(),
      SassLoader.Fetch(),
    ])
    return { Vue, Mitt, Sass }
  }

  #validateStart() {
    if (this.#componentsInQueue.size < 1) {
      throw new Error('You must add at least one component to an AppFactory')
    }

    if (isBlank(this.#rootComponent)) {
      throw new Error('You must add one root component to an AppFactory')
    }
  }

  #validateOneMount() {
    if (this.#mounted === true) {
      throw new Error('You can only mount an AppFactory instance once')
    }
  }
}

/**
 * Registers a consumer app definition, to be mounted by the parent `bbVue.rootApp` instance as a CRM
 * @param {consumerAppDef} appDef The definition of a consumer app
 * @returns {function} Lookup function to retrieve consumer app instance
 */
function addConsumerRootDef(ns, appDef) {
  try {
    // Lookup rootApp ctx
    let rootApp = RootApp.component()

    // Hook in orphan protection if requested
    // BUGGED: ns race conditions due to repeated ns.getRunningScript() calls
    /* if (appDef.__config.shutdownWithPid || appDef.__config.shutdownRootWithPid) {
      // Watch pid on interval
      const pidWatchRate = 500
      const pidWatch = setInterval(async () => {
        // Attempt to find running PID
        let pid = ns?.getRunningScript()?.pid

        // Eject if pid is healthy
        if (pid > 0) return

        // Try to shutdown either AppRoot or consumer root as needed
        try {
          if (appDef.__config.shutdownRootWithPid) {
            await rootApp.rootShutdown()
          } else {
            await rootApp.unmountConsumerRootByUuid(appDef.__uuid)
          }
        } catch (error) {
          ns.tprint(
            `ERROR: bb-vue app "${appDef.name}" is orphaned but ending process failed:\n${toJson(
              error
            )}`
          )
        } finally {
          // Whatever the result of the cleanup, end the interval
          clearInterval(pidWatch)
        }
      }, pidWatchRate)
    } */

    // Add appDef to rootApp and return app handle to consumer
    return rootApp.addConsumerRootDef(appDef)
  } catch (error) {
    throw new Error(
      `rootApp cannot be located, or issue mounting consumer appDef:\n${toJson(error)}`
    )
  }
}
