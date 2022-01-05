import { WindowStates } from '/bb-vue/components/_resources.js'
import { css, getGlobal, html } from '/bb-vue/lib.js'

export default {
  name: 'bbv-app-tray',
  template: html`
    <div class="__CMP_NAME__" bbv-foreground v-if="trayItems.length">
      <template v-for="item in trayItems" :key="item.uuid">
        <bbv-button
          @click="toggleTrayItem(item.uuid)"
          :class="{ [item.details.state.value]: true }"
        >
          <template v-if="item.details.state.value == WindowStates.open">🔽</template>
          <template v-else> {{ item.details.title }} </template>
        </bbv-button>
      </template>
    </div>
  `,
  data() {
    return {
      WindowStates,
    }
  },
  computed: {
    trayItems() {
      return this.$root.mountedWindows.map((win) => {
        return this.buildTrayItem(win)
      })
    },
  },
  methods: {
    toggleTrayItem(uuid) {
      let trayItem = this.trayItems.find((x) => x.uuid == uuid)
      if (trayItem.details.state.value != WindowStates.minimized) {
        trayItem.actions.minimize()
      } else {
        trayItem.actions.open()
      }
    },
    buildTrayItem(win) {
      let Vue = getGlobal('Vue')
      let trayItem = {
        uuid: win.uuid,
        details: {
          title: Vue.toRef(win, 'title'),
          state: Vue.toRef(win, 'windowState'),
        },
        actions: {
          open: win.open,
          minimize: win.minimize,
        },
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
      display: flex;
      justify-content: flex-start;

      .bbv-button {
        color: var(--bbvAppTrayFgColor);
        max-width: 50px;
        overflow: ellipse;

        &.open {
          border: 1px solid var(--bbvAppTrayFgColor);
        }

        &.minimized {
          padding: 2px;
        }

        &.closed {
          filter: grayscale(1);
        }
      }
    }
  `,
}
