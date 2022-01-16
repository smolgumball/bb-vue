// prettier-ignore
import { html, Keys, Mitt, RootApp, Vue, win } from '/bb-vue/lib.js'

import ConsumerRoot from '/bb-vue/components/internal/ConsumerRoot.js'
import CssManager from '/bb-vue/components/internal/CssManager.js'

import Win from '/bb-vue/components/Win.js'
import WinManager from '/bb-vue/components/WinManager.js'
import AppTray from '/bb-vue/components/AppTray.js'
import AppTrayGroup from '/bb-vue/components/AppTrayGroup.js'
import Button from '/bb-vue/components/Button.js'
import JsonDisplay from '/bb-vue/components/JsonDisplay.js'
import Tabs from '/bb-vue/components/Tabs.js'
import AppRootStyles from '/bb-vue/components/AppRoot.Styles.js'
import ObjectDisplay from '/bb-vue/components/ObjectDisplay.js'

export const ComponentLibrary = [
  ConsumerRoot,
  CssManager,
  Win,
  WinManager,
  AppTray,
  AppTrayGroup,
  Button,
  JsonDisplay,
  ObjectDisplay,
  Tabs,
]

export default {
  __libraryRoot: true,
  name: 'bbv-app-root',
  template: html`
    <transition name="rootAppIntro" appear>
      <main class="__CMP_NAME__" bbv-container v-if="depsLoaded">
        <transition-group name="consumerRootIntro" appear>
          <bbv-consumer-root
            v-for="def in consumerRootDefs"
            :key="def.__uuid"
            :id="def.__uuid"
            :consumer-root-def="def"
            @consumer-root-mounted="mountConsumerRoot"
            @consumer-root-unmount-requested="unmountConsumerRootByUuid"
            @root-shutdown-requested="rootShutdown"
          />
        </transition-group>
        <bbv-css-manager :consumer-root-defs="consumerRootDefs" />
        <bbv-win-manager />
        <bbv-app-tray />
      </main>
    </transition>
  `,
  data() {
    const bus = Mitt().createBus()
    return {
      depsLoaded: false,
      internals: {
        bus: bus,
        send: bus.emit,
        listen: bus.on,
        store: {
          consumerRootDefs: [],
          consumerRootMounts: [],
          winMounts: [],
        },
        winManager: null,
      },
    }
  },
  created() {
    this.loadDeps()
  },
  provide() {
    return this.$data
  },
  computed: {
    isReady() {
      return this.internals.winManager
    },
    consumerRootDefs() {
      return this.isReady ? this.allCrds : []
    },
    allCrds() {
      return this.internals.store.consumerRootDefs
    },
    allCrms() {
      return this.internals.store.consumerRootMounts
    },
  },
  methods: {
    async loadDeps() {
      // console.time('AppRoot:loadDeps')
      if (!win[Keys.vueUseModuleKey]) {
        await this.$scriptx.load('https://unpkg.com/@vueuse/shared@7.5.3/index.iife.min.js')
        await this.$scriptx.load('https://unpkg.com/@vueuse/core@7.5.3/index.iife.min.js')
      }
      this.depsLoaded = true
      // console.timeEnd('AppRoot:loadDeps')
    },
    addConsumerRootDef(consumerRootDef) {
      const { markRaw } = Vue()
      let rawConsumerRootDef = markRaw(consumerRootDef)
      this.internals.store.consumerRootDefs = [
        ...this.allCrds.filter((x) => {
          return x.__uuid !== rawConsumerRootDef.__uuid
        }),
        rawConsumerRootDef,
      ]

      return () => this.findConsumerRootMount(rawConsumerRootDef.__uuid)
    },
    mountConsumerRoot(consumerRootMount) {
      this.internals.store.consumerRootMounts = [
        ...this.allCrms.filter((x) => {
          return x.$options.__uuid !== consumerRootMount.$options.__uuid
        }),
        consumerRootMount,
      ]
    },
    async unmountConsumerRootByUuid(crmUuid) {
      await this.internals.winManager.closeAllWinsByCrmUuid(crmUuid)
      this.internals.store.consumerRootMounts = this.allCrms.filter((x) => {
        return x.$options.__uuid !== crmUuid
      })
      this.internals.store.consumerRootDefs = this.allCrds.filter((x) => {
        return x.__uuid !== crmUuid
      })
    },
    findConsumerRootMount(rootMountName) {
      return (
        this.allCrms.find((x) => {
          return rootMountName == x.$options.__uuid
        }) ?? null
      )
    },
    async rootShutdown() {
      for (const x of this.allCrms) {
        await this.unmountConsumerRootByUuid(x.$options.__uuid)
      }
      setTimeout(() => {
        RootApp.cleanup()
      }, 50)
    },
  },
  ...AppRootStyles,
}
