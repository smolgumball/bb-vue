import { WindowStates, TrayItemTypes } from '/bb-vue/components/_resources.js'
import { css, getGlobal, html } from '/bb-vue/lib.js'

export default {
  name: 'bbv-app-tray',
  template: html`
    <div class="__CMP_NAME__" :class="{ isCollapsed, isHidden: !trayItems.length }">
      <transition-group name="appTrayItemFadeUp" appear>
        <template v-for="group in trayItems" :key="group.root.uuid">
          <bbv-app-tray-group>
            <template :key="window.uuid" v-for="window in group.windowMounts">
              <bbv-button :title="window.title" @click="toggleTrayItem(window)" small>
                <template v-if="window.windowState == WindowStates.open">🔽</template>
                <template v-else>{{ window.title }}</template>
              </bbv-button>
            </template>
          </bbv-app-tray-group>
        </template>
      </transition-group>
    </div>
  `,
  inject: ['internals'],
  props: {
    appTrayConfigDefaults: {
      type: Object,
      default() {
        return {
          showWindows: true,
        }
      },
    },
  },
  data() {
    return {
      WindowStates,
      TrayItemTypes,
      isCollapsed: false,
    }
  },
  computed: {
    trayItems() {
      let windowMounts = this.internals.store.windowMounts
        .map((windowMount) => this.buildTrayItemFor(TrayItemTypes.windowMount, windowMount))
        .filter((x) => !!x)

      let consumerRootMounts = this.internals.store.consumerRootMounts
        .map((consumerRootMount) =>
          this.buildTrayItemFor(TrayItemTypes.consumerRootMount, consumerRootMount)
        )
        .filter((x) => !!x)

      let windowsByRoots = consumerRootMounts.reduce((acc, root) => {
        let ownedWindows = windowMounts.filter((x) => x.owner == root.uuid)
        if (ownedWindows.length) {
          acc.push({ root, windowMounts: ownedWindows })
        }
        return acc
      }, [])

      return windowsByRoots
    },
  },
  mounted() {
    this.watchGameDock()
  },
  methods: {
    watchGameDock() {
      const { useIntervalFn } = getGlobal('VueUse')
      let gameDockSelector = document.querySelector('.MuiDrawer-root.MuiDrawer-docked')

      useIntervalFn(() => {
        let width = gameDockSelector.clientWidth
        if (width < 240) {
          this.isCollapsed = true
        } else {
          this.isCollapsed = false
        }
      }, 400)
    },
    toggleTrayItem(trayItem) {
      if (trayItem.windowState != WindowStates.open) {
        trayItem.windowMount.open()
      } else {
        trayItem.windowMount.close()
      }
    },
    buildTrayItemFor(trayItemType, trayCompatibleItem) {
      const windowTrayItem = (windowMount) => {
        return {
          kind: TrayItemTypes.windowMount,
          uuid: windowMount.uuid,
          title: windowMount.title,
          owner: windowMount.owner.$options.__name,
          windowState: windowMount.windowState,
          windowMount: windowMount,
          trayConfigLocal: Object.assign(
            windowMount.appTrayConfigDefaults,
            windowMount.appTrayConfig
          ),
          trayConfigFromParent: Object.assign(
            this.appTrayConfigDefaults,
            windowMount.owner.appTrayConfig
          ),
        }
      }

      const rootTrayItem = (consumerRootMount) => {
        const uuid = consumerRootMount.$options.__name
        const name = consumerRootMount.$options.name
        return {
          kind: TrayItemTypes.consumerRootMount,
          uuid: uuid,
          title: name,
          trayConfigFromParent: Object.assign(
            this.appTrayConfigDefaults,
            consumerRootMount.appTrayConfig
          ),
        }
      }

      let trayItem
      switch (trayItemType) {
        case TrayItemTypes.windowMount:
          trayItem = windowTrayItem(trayCompatibleItem)
          break
        case TrayItemTypes.consumerRootMount:
          trayItem = rootTrayItem(trayCompatibleItem)
          break
      }

      if (trayItem.kind == TrayItemTypes.windowMount) {
        if (
          trayItem.trayConfigLocal.show !== true ||
          trayItem.trayConfigFromParent.showWindows !== true
        ) {
          return null
        }
        if (trayItem.trayConfigLocal.title) {
          trayItem.title = trayItem.trayConfigLocal.title
        }
      }

      /* if (trayItem.kind == TrayItemTypes.consumerRootMount) {
        if (trayItem.trayConfigFromParent.title) {
          trayItem.title = trayItem.trayConfigFromParent.title
        }
      } */

      return trayItem
    },
  },
  scss: css`
    .__CMP_NAME__ {
      @include bbv-scrollbar($height: 10px);

      pointer-events: auto;
      position: absolute;
      z-index: 1400;

      bottom: 0;
      left: 0;

      display: flex;
      padding: 10px;
      width: 249px;
      max-height: 75px;
      overflow-x: scroll;
      overflow-y: hidden;

      box-shadow: inset 0px 0px 20px 0px var(--bbvBoxShadowColor1);
      border-top: 4px solid var(--bbvBorderColor);
      background-color: var(--bbvAppTrayBgColor);
      transition: width 0.4s ease, opacity 0.4s ease, transform 0.4s ease;

      &.isCollapsed {
        width: 57px;
      }

      &.isHidden {
        transform: translateY(75px);
        opacity: 0;
      }

      .bbv-button {
        color: var(--bbvAppTrayFgColor);
        padding: 6px 3px;
        max-width: 50px;
        min-width: 25px;
        max-height: 30px;
        overflow: hidden;
        white-space: nowrap;
        border-bottom: 1px solid var(--bbvAppTrayBorderColor);
      }

      .bbv-button + .bbv-button {
        margin-left: 8px;
      }

      .appTrayItemFadeUp-enter-active,
      .appTrayItemFadeUp-leave-active {
        transition: opacity 0.4s ease, transform 0.4s ease;
      }

      .appTrayItemFadeUp-enter-from,
      .appTrayItemFadeUp-leave-to {
        opacity: 0;
        transform: translateY(50px);
        transform-origin: left center;
      }
    }
  `,
}
