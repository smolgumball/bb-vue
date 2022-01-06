import { WindowStates, TrayItemTypes } from '/bb-vue/components/_resources.js'
import { css, html } from '/bb-vue/lib.js'

export default {
  name: 'bbv-app-tray',
  template: html`
    <div class="__CMP_NAME__" bbv-foreground v-if="trayItems?.length">
      <template v-for="item in trayItems" :key="item.uuid">
        <template v-if="item.kind == TrayItemTypes.windowMount">
          <bbv-button small :title="item.title" @click="toggleTrayItem(item)">
            <template v-if="item.windowState == WindowStates.open">🔽</template>
            <template v-else>{{ item.title }}</template>
          </bbv-button>
        </template>
        <template v-else-if="item.kind == TrayItemTypes.consumerRootMount">
          <bbv-button small :title="item.title" @click="toggleTrayItem(item)"
            >{{ item.title }}</bbv-button
          >
        </template>
      </template>
    </div>
  `,
  inject: ['internals'],
  props: {
    trayConfigAppDefault: {
      type: Object,
      default() {
        return {
          title: null,
          showApp: false,
          showWindows: true,
        }
      },
    },
  },
  data() {
    return {
      WindowStates,
      TrayItemTypes,
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
      return [...windowMounts, ...consumerRootMounts]
    },
  },
  methods: {
    toggleTrayItem(trayItem) {
      if (trayItem.kind == TrayItemTypes.consumerRootMount) {
        let allOwnedWindows = this.trayItems.filter((x) => {
          return (
            x.kind == TrayItemTypes.windowMount &&
            x.owner.$options.name == trayItem.owner.$options.name
          )
        })
        let hasOwnedWindows = allOwnedWindows.length
        let allAreClosed = allOwnedWindows.every((x) => x.status != WindowStates.open)
        if (hasOwnedWindows && allAreClosed) {
          allOwnedWindows.forEach((x) => x.actions.open())
        } else {
          allOwnedWindows.forEach((x) => x.actions.close())
        }
      } else if (trayItem.kind == TrayItemTypes.windowMount) {
        if (trayItem.windowState != WindowStates.open) {
          trayItem.actions.open()
        } else {
          trayItem.actions.close()
        }
      }
    },
    buildTrayItemFor(trayItemType, trayCompatibleItem) {
      const windowTrayItem = (windowMount) => {
        return {
          kind: TrayItemTypes.windowMount,
          uuid: windowMount.uuid,
          title: windowMount.title,
          owner: windowMount.owner,
          windowState: windowMount.windowState,
          trayConfigWindow: Object.assign(
            windowMount.appTrayConfigDefault,
            windowMount.appTrayConfig
          ),
          trayConfigConsumerRoot: Object.assign(
            this.trayConfigAppDefault,
            windowMount.owner.appTrayConfig
          ),
          actions: windowMount,
        }
      }

      const appTrayItem = (consumerRootMount) => {
        return {
          kind: TrayItemTypes.consumerRootMount,
          uuid: consumerRootMount.$options.name,
          title: consumerRootMount.$options.name,
          owner: consumerRootMount,
          trayConfigConsumerRoot: Object.assign(
            this.trayConfigAppDefault,
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
          trayItem = appTrayItem(trayCompatibleItem)
          break
      }

      if (trayItem.kind == TrayItemTypes.windowMount) {
        if (
          trayItem.trayConfigWindow.show !== true ||
          trayItem.trayConfigConsumerRoot.showWindows !== true
        ) {
          return null
        }
        if (trayItem.trayConfigWindow.title) {
          trayItem.title = trayItem.trayConfigWindow.title
        }
      }

      if (trayItem.kind == TrayItemTypes.consumerRootMount) {
        if (trayItem.trayConfigConsumerRoot.title) {
          trayItem.title = trayItem.trayConfigConsumerRoot.title
        }

        if (trayItem.trayConfigConsumerRoot.showApp == false) {
          return null
        }
      }

      return trayItem
    },
  },
  scss: css`
    .__CMP_NAME__ {
      position: absolute;
      bottom: 0;
      left: 0;
      padding: 10px;
      background-color: var(--bbvAppTrayBgColor);
      box-shadow: inset 0px 0px 20px 0px var(--bbvBoxShadowColor1);
      border-top: 2px solid var(--bbvBorderColor);
      display: flex;
      width: 250px;
      max-height: 75px;
      overflow: auto;
      flex-direction: row;

      .bbv-button {
        color: var(--bbvAppTrayFgColor);
        padding: 6px 3px;
        max-width: 75px;
        min-width: 25px;
        max-height: 30px;
        overflow: hidden;
        white-space: nowrap;
        border-bottom: 3px solid var(--bbvAppTrayBorderColor);
      }

      .bbv-button + .bbv-button {
        margin-left: 6px;
      }
    }
  `,
}
