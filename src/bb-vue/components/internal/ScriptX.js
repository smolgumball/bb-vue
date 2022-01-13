// prettier-ignore
import { doc, Vue } from '/bb-vue/lib.js'

class Utils {
  static isUndefined(x) {
    return x === undefined
  }
  static pick(o, props) {
    let x = {}
    props.forEach((k) => {
      x[k] = o[k]
    })
    return x
  }
  static omit(o, props) {
    let x = {}
    Object.keys(o).forEach((k) => {
      if (props.indexOf(k) === -1) x[k] = o[k]
    })
    return x
  }
  static omitBy(o, pred) {
    let x = {}
    Object.keys(o).forEach((k) => {
      if (!pred(o[k])) x[k] = o[k]
    })
    return x
  }
  // custom defaults function suited to our specific purpose
  static defaults(o, ...sources) {
    sources.forEach((s) => {
      Object.keys(s).forEach((k) => {
        if (this.isUndefined(o[k]) || o[k] === '') o[k] = s[k]
      })
    })
  }
}

class VueScriptX {
  constructor() {
    this.installed = false
    this.promise = Promise.resolve()
    this.loaded = {}
    this.props = ['unload', 'src', 'type', 'async', 'integrity', 'text', 'crossorigin']
  }
  install(app) {
    app.config.globalProperties.$scriptx = this
    let self = this
    if (self.installed) return
    app.component('scriptx', {
      props: self.props,
      // Uses render method with <slot>s, see: https://v3.vuejs.org/guide/render-function.html
      render() {
        const { h } = Vue()
        return h(
          'div',
          { style: 'display:none' },
          this.$slots.default ? this.$slots.default() : undefined
        )
      },
      mounted() {
        let parent = this.$el.parentElement
        if (!this.src) {
          self.promise = self.promise.then(() => {
            let script = doc.createElement('script')
            let el = this.$el.innerHTML
            el = el.replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&')
            script.type = 'text/javascript'
            script.appendChild(doc.createTextNode(el))
            parent.appendChild(script)
            this.$emit('loaded') // any other proper way to do this or emit error?
          })
        } else {
          let opts = Utils.omitBy(Utils.pick(this, self.props), Utils.isUndefined)
          opts.parent = parent
          // this syntax results in an implicit return
          let load = () => {
            self.load(this.src, opts).then(
              () => this.$emit('loaded'),
              (err) => this.$emit('error', err)
            )
          }
          if (Utils.isUndefined(this.async) || this.async === 'false')
            self.promise = self.promise.then(load)
          // serialize execution
          else load() // inject immediately
        }
        this.$nextTick(() => {
          this.$el.parentElement.removeChild(this.$el)
          // NOTE: this.$el.remove() may be used, but IE sucks, see: https://github.com/taoeffect/vue-script2/pull/17
        })
      },
      unmounted() {
        if (this.unload) {
          new Function(this.unload)() // eslint-disable-line
          delete self.loaded[this.src]
        }
      },
    })
    self.installed = true
  }
  load(src, opts = { parent: doc.head }) {
    if (!this.loaded[src]) {
      this.loaded[src] = new Promise((resolve, reject) => {
        let script = doc.createElement('script')
        // omit the special options that VueScriptX supports
        Utils.defaults(script, Utils.omit(opts, ['unload', 'parent']), { type: 'text/javascript' })
        // async may not be used with 'doc.write'
        script.async = false
        script.src = src
        // crossorigin in HTML and crossOrigin in the DOM per HTML spec
        if (opts.crossorigin) {
          script.crossOrigin = opts.crossorigin
        }
        // handle onload and onerror
        script.onload = () => resolve(src)
        script.onerror = () => reject(new Error(src))
        opts.parent.appendChild(script)
      })
    }
    return this.loaded[src]
  }
}

export default new VueScriptX()
