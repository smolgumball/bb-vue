import { isBlank, toStr, ProcessingException } from '/bb-vue/lib.js'

export default class AppStyles {
  /**
   * Retrieve a freshly compiled version of global application SCSS.
   * @returns {Promise<String>} compiledGlobalStyles
   */
  static async Compile(appConfig, appStyles, Sass) {
    let compiledScss = ''
    let customAppStyles = toStr(appConfig.scssCustomAppStyles)
    let hasCustomAppStyles = !isBlank(customAppStyles)
    let shouldMergeStyles = appConfig.scssCustomAppStylesShouldMerge

    let sourceScss = ''
    if (hasCustomAppStyles) {
      if (shouldMergeStyles) {
        sourceScss = appStyles + '\n' + customAppStyles
      } else {
        sourceScss = customAppStyles
      }
    } else {
      sourceScss = appStyles
    }

    if (Sass) {
      try {
        compiledScss = await Sass.compileAsync(sourceScss, appConfig.scssCompilerOptions)
      } catch (error) {
        compiledScss = ''
        throw new ProcessingException('GlobalSCSS', error)
      }
    }

    return toStr(compiledScss)
  }
}
