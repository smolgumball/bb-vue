// prettier-ignore
import { doc, getGlobal, isBlank, lodash, addConsumerRootDef, setGlobal, html, toStr } from '/bb-vue/lib.js'

import ComponentManager from '/bb-vue/ComponentManager.js'
import MittLoader from '/bb-vue/MittLoader.js'
import SassLoader from '/bb-vue/SassLoader.js'
import VueLoader from '/bb-vue/VueLoader.js'

import ScriptX from '/bb-vue/components/internal/ScriptX.js'

// prettier-ignore
import { default as AppRoot, ComponentLibrary } from '/bb-vue/components/AppRoot.js'

const CreateOrGetRootVueApp = async (Vue, Sass, forceReload = false) => {
  const rootConfig = {
    appId: 'bb-vue-root',
    scssResources: AppRoot.scssResources,
  }

  // console.time('CreateOrGetRootVueApp')

  let existingRootDom = doc.getElementById(rootConfig.appId)
  if (!forceReload && existingRootDom && getGlobal('rootApp')?._instance) {
    return getGlobal('rootApp')
  } else if (forceReload) {
    getGlobal('rootApp').unmount()
    existingRootDom?.remove()
  }

  let componentManager = new ComponentManager(rootConfig, Sass)
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

  doc.body.insertAdjacentHTML('afterbegin', html`<div id="${rootConfig.appId}" bbv-root></div>`)
  rootApp.mount(`#${rootConfig.appId}`)
  setGlobal('rootApp', rootApp)

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

    let rootVueApp = await CreateOrGetRootVueApp(Vue, Sass, this.#appConfig.forceReload)
    let componentManager = new ComponentManager(
      this.#appConfig,
      Sass,
      this.#appConfig.scssResources
    )
    componentManager.add(...this.#componentsInQueue)
    await componentManager.processAll()
    componentManager.registerWithVueApp(rootVueApp)

    let processedConsumerRoot = {
      ...componentManager.processedConsumerRoot,
      __finalStyles: componentManager.gatherAllProcessedStyles(),
    }

    let consumerAppHandleFn = addConsumerRootDef(processedConsumerRoot)

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
    this.#rootComponent = cmpDef
    this.#componentsInQueue.add(cmpDef)

    return this
  }

  async #runLoaders() {
    const [Vue, Mitt, Sass] = await Promise.all([
      VueLoader.Get(),
      MittLoader.Get(),
      SassLoader.Get(),
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
