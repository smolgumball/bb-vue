// prettier-ignore
import { WinStates, TrayItemTypes } from '/bb-vue/components/internal/_resources.js'

// prettier-ignore
import { css, doc, html, VueUse } from '/bb-vue/lib.js'

export default {
  name: 'bbv-app-tray',
  template: html`
    <div class="__CMP_NAME__" :class="{ isCollapsed, shouldDisplay }">
      <transition-group name="appTrayItemFadeUp" appear>
        <bbv-app-tray-group key="actions" tray-teleport />
        <template v-for="group in trayItems" :key="group.root.uuid">
          <bbv-app-tray-group :app-title="group.root.title">
            <template :key="win.uuid" v-for="win in group.winMounts">
              <bbv-button
                :title="win.title"
                @click="toggleTrayItem(win)"
                :class="{ isOpen: win.winState == WinStates.open }"
              >
                {{ win.title }}
              </bbv-button>
            </template>
          </bbv-app-tray-group>
        </template>
      </transition-group>
    </div>
  `,
  inject: ['internals'],
  data() {
    return {
      WinStates,
      TrayItemTypes,
      isCollapsed: false,
      isHidden: false,
    }
  },
  computed: {
    trayItems() {
      let winMountTrayItems = this.internals.store.winMounts
        .map((winMount) => this.buildTrayItemFor(TrayItemTypes.winMount, winMount))
        .filter((x) => !!x)

      let consumerRootMountTrayItems = this.internals.store.consumerRootMounts
        .map((consumerRootMount) =>
          this.buildTrayItemFor(TrayItemTypes.consumerRootMount, consumerRootMount)
        )
        .filter((x) => !!x)

      let winsByRoots = consumerRootMountTrayItems.reduce((acc, root) => {
        let ownedWins = winMountTrayItems.filter((x) => x.ownerUuid == root.uuid)
        if (ownedWins.length) {
          acc.push({ root, winMounts: ownedWins })
        }
        return acc
      }, [])

      return winsByRoots
    },
    shouldDisplay() {
      return /* this.isHidden === false && */ this.trayItems.length
    },
  },
  mounted() {
    this.watchGameDock()
  },
  methods: {
    watchGameDock() {
      const { useIntervalFn } = VueUse()
      useIntervalFn(() => {
        let gameDockSelector = doc.querySelector(
          '#root > div > div > .MuiDrawer-root.MuiDrawer-docked'
        )
        let width = gameDockSelector?.clientWidth

        if (!width) {
          this.isHidden = true
          return
        }

        this.isHidden = false
        if (width < 240) {
          this.isCollapsed = true
        } else {
          this.isCollapsed = false
        }
      }, 400)
    },
    toggleTrayItem(trayItem) {
      if (trayItem.winState != WinStates.open) {
        trayItem.winMount.open()
      } else {
        trayItem.winMount.close()
      }
    },
    buildTrayItemFor(trayItemType, trayCompatibleItem) {
      const winTrayItem = (winMount) => {
        const ownerOpts = winMount.owner.$options
        return {
          kind: TrayItemTypes.winMount,
          uuid: winMount.uuid,
          title: winMount.title,
          ownerUuid: ownerOpts.__uuid,
          winState: winMount.winState,
          winMount: winMount,
        }
      }

      const rootTrayItem = (consumerRootMount) => {
        const opts = consumerRootMount.$options
        return {
          kind: TrayItemTypes.consumerRootMount,
          uuid: opts.__uuid,
          title: opts.name,
        }
      }

      let trayItem
      switch (trayItemType) {
        case TrayItemTypes.winMount:
          trayItem = winTrayItem(trayCompatibleItem)
          break
        case TrayItemTypes.consumerRootMount:
          trayItem = rootTrayItem(trayCompatibleItem)
          break
      }

      if (trayItem.kind == TrayItemTypes.winMount) {
        if (trayItem.winMount.trayHide !== false) {
          return null
        }
        if (trayItem.winMount.trayTitle) {
          trayItem.title = trayItem.winMount.trayTitle
        }
      }

      return trayItem
    },
  },
  scss: css`
    .__CMP_NAME__ {
      @include typo-basic;

      pointer-events: auto;
      position: absolute;
      z-index: 1400;

      bottom: 0;
      left: 0;

      display: flex;
      align-items: stretch;
      padding: 10px;
      width: 249px;
      clip-path: inset(-60px 0 0 0);

      box-shadow: inset 0px 0px 10px 0px var(--bbvBoxShadowColor1);
      border-top: 1px solid var(--bbvBorderColor);
      background-color: var(--bbvAppTrayBgColor);
      transition: width 0.2s cubic-bezier(0.86, 0, 0.07, 1), opacity 0.4s ease, transform 0.4s ease;

      &:hover {
        width: 100%;
        z-index: 1700;

        &.isCollapsed {
          width: 100%;
        }
      }

      &.isCollapsed {
        width: 57px;
      }

      &:not(.shouldDisplay) {
        transform: translateY(100px);
        opacity: 0;
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
