import { html, css } from '/bb-vue/lib.js'

export default {
  __libraryRoot: true,
  name: 'bbv-app-root',
  template: html`
    <main class="__CMP_NAME__" bbv-container>
      <section v-for="app in mountedApps" :key="app.name" :id="app.name">
        <component :is="app.name" bbv-foreground />
      </section>
      <bbv-window-manager />
      <bbv-app-tray />
    </main>
  `,
  data() {
    return {
      mountedApps: {},
    }
  },
  computed: {
    styles() {
      let styles = ''
      styles += this.$options.__finalStyles.join('')
      Object.values(this.mountedApps).forEach((x) => (styles += x.__finalStyles.join('')))
      return styles
    },
  },
  watch: {
    styles: {
      immediate: true,
      handler(newVal) {
        let styleId = `styles-for-${this.$options.name}`
        if (!this.$el) return
        this.$el.querySelectorAll(`#${styleId}`).forEach((x) => (x.__staleStyles = true))
        this.$el.insertAdjacentHTML(
          'afterbegin',
          html`
            <style type="text/css" id="${styleId}">
              ${newVal}
            </style>
          `
        )
        this.$el.querySelectorAll(`#${styleId}`).forEach((x) => x.__staleStyles && x.remove())
      },
    },
  },
  created() {
    console.log('approot created')
    this.$listen('app:shutdown', this.onAppShutdown)
  },
  methods: {
    registerApp(appDef) {
      this.mountedApps[appDef.name] = appDef
    },
    onAppShutdown(appInstance) {
      delete this.mountedApps[appInstance.$options.name]
    },
  },
  scssResources: css`
    @mixin typo-basic {
      font-family: 'Lucida Console', monospace;
      font-weight: 400;
      font-size: 16px;
      line-height: 1.1;
    }
  `,
  scss: css`
    body {
      --bbvBorderColor: #0f4878;
      --bbvBoxShadowColor1: #0000007a;
      --bbvBoxShadowColor2: #040f18;
      --bbvAppInnerFgColor: #89d3e4;
      --bbvAppInnerBgColor: #274b64;
      --bbvFontLightColor: #89d3e4;
      --bbvFontLightAltColor: #89d3e4;
      --bbvButtonFgColor: #12b3e3;
      --bbvButtonBgColor: #0b1420;
      --bbvButtonHoverFgColor: #00fff3;
      --bbvButtonHoverBgColor: #162a47;
      --bbvWindowTitlebarFgColor: #89d3e4;
      --bbvWindowTitlebarBgColor: #0f4878;
      --bbvWindowActionsFgColor: #83d5d9;
      --bbvWindowActionsBgColor: #0f4878;
      --bbvHackerDarkFgColor: #c5c255;
      --bbvHackerDarkBgColor: #171c23;
      --bbvAppTrayFgColor: #89d3e4;
      --bbvAppTrayBgColor: #274b64;
    }

    [bbv-root] {
      position: fixed;
      z-index: 1500;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      pointer-events: none;
    }

    [bbv-container] {
      @include typo-basic;

      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;

      * {
        box-sizing: border-box;
      }
    }

    [bbv-foreground] {
      z-index: 1500;
      pointer-events: auto;
    }
  `,
}
