// prettier-ignore
import { isBlank, lodash, toStr } from '/bb-vue/lib.js'

// prettier-ignore
import { ComponentValidationException, ProcessingException, ReplacementTokens } from '/bb-vue/lib.js'

export default class ComponentManager {
  #appConfig
  #Sass
  #scssResources
  #hasProcessed = false
  #rawComponents = new Set()
  #processingReports = []

  constructor(appConfig, Sass, scssResources) {
    this.#appConfig = appConfig
    this.#Sass = Sass
    this.#scssResources = toStr(scssResources)
  }

  add(...args) {
    if (isBlank(args)) {
      throw new Error('Please provide one or more components to add')
    }
    for (let cmpDef of args) {
      cmpDef = Object.assign({}, cmpDef)
      cmpDef = ComponentManager.Validate(cmpDef)
      this.#rawComponents.add(cmpDef)
    }

    return this
  }

  async processAll() {
    for (let cmpDef of this.#rawComponents) {
      let processed = await this.#processSingle(cmpDef)
      this.#processingReports.push(processed)
    }
    this.#hasProcessed = true

    return this
  }

  registerWithVueApp(vueApp) {
    if (this.#hasProcessed === false) {
      throw new Error('All components must be processed before being registered with the vueApp')
    }

    this.#processingReports.forEach((processingReport) => {
      if (!processingReport.cmpDef.__libraryRoot) {
        // Remove old cmpDef before adding new one
        if (vueApp.component(processingReport.cmpDef.name) && vueApp?._context?.components) {
          delete vueApp._context.components[processingReport.cmpDef.name]
        }
        vueApp.component(processingReport.cmpDef.name, processingReport.cmpDef)
      }
    })

    return vueApp
  }

  gatherAllProcessedStyles() {
    return this.#processingReports.map((x) => x.cmpDef.__processedStyles)
  }

  static Validate(cmpDef) {
    if (isBlank(cmpDef)) {
      throw new ComponentValidationException('Component definition is empty', cmpDef)
    }
    if (isBlank(toStr(cmpDef.name))) {
      throw new ComponentValidationException(`Component needs 'name' key of type String`, cmpDef)
    }
    /* if (isBlank(toStr(cmpDef.template))) {
      throw new ComponentValidationException(
        `Component needs 'template' key of type String`,
        cmpDef
      )
    } */
    return cmpDef
  }

  async #processSingle(cmpDef) {
    let { css, didProcess: didProcessCss } = this.#processCss(cmpDef)
    let { scss, didProcess: didProcessScss } = await this.#processScss(cmpDef)
    let { template, didProcess: didProcessTemplate } = this.#processTemplate(cmpDef)

    if (didProcessCss) {
      delete cmpDef.css
      delete cmpDef.style
    }

    if (didProcessScss) {
      delete cmpDef.scss
      delete cmpDef.style
    }

    let processedMergedStyles = [css, scss].join('\n\n')
    if (didProcessScss || didProcessCss) {
      cmpDef.__processedStyles = processedMergedStyles
    }

    if (didProcessTemplate) {
      cmpDef.template = template
    }

    return {
      cmpDef,
      results: {
        css,
        scss,
        styles: processedMergedStyles,
        template,
        didProcessCss,
        didProcessScss,
        didProcessTemplate,
      },
    }
  }

  #processCss(cmpDef) {
    let didProcess = false
    let css = [cmpDef.css, cmpDef.style].find((x) => !isBlank(x))

    if (css) {
      try {
        css = this.#performTokenReplacements(css, this.#appConfig.appId, cmpDef.name)
        didProcess = true
      } catch (error) {
        css = ''
        throw new ProcessingException('CSS', error)
      }
    }

    return { css: toStr(css), didProcess }
  }

  async #processScss(cmpDef) {
    let didProcess = false
    let scss = ''

    scss = [cmpDef.scss, cmpDef.sass].find((x) => !isBlank(x))
    if (scss) {
      scss = this.#performTokenReplacements(scss, this.#appConfig.appId, cmpDef.name)
      scss = `${this.#scssResources}\n${scss}`
      try {
        scss = await this.#Sass.compileAsync(scss, {})
        didProcess = true
      } catch (error) {
        scss = ''
        throw new ProcessingException('SCSS', error)
      }
    }

    return { scss: toStr(scss), didProcess }
  }

  #processTemplate(cmpDef) {
    let didProcess = false
    let template = toStr(cmpDef.template)

    if (!isBlank(template)) {
      try {
        template = this.#performTokenReplacements(template, this.#appConfig.appId, cmpDef.name)
        didProcess = true
      } catch (error) {
        template = ''
        throw new ProcessingException('Template', error)
      }
    }

    return { template: toStr(template), didProcess }
  }

  #performTokenReplacements(value, appId, componentName) {
    if (!lodash.isString(value)) return value
    value = value.replaceAll(ReplacementTokens.appId, appId)
    value = value.replaceAll(ReplacementTokens.componentName, componentName)
    return value
  }

  get processedLibraryRoot() {
    return this.#processingReports.find((x) => x.cmpDef.__libraryRoot === true).cmpDef
  }

  get processedConsumerRoot() {
    return this.#processingReports.find((x) => x.cmpDef.__consumerRoot === true).cmpDef
  }
}
