// prettier-ignore
import { css, html } from '/bb-vue/lib.js'

export default {
  name: 'bbv-app-tray-group',
  props: ['appTitle', 'trayTeleport'],
  template: html`
    <transition name="appTrayGroupFadeUp" appear>
      <div
        class="__CMP_NAME__"
        :class="{ trayTeleport: trayTeleport !== undefined }"
        :id="trayTeleport !== undefined ? 'app-tray' : undefined"
        :title="appTitle"
      >
        <template v-if="appTitle">
          <div class="app_title">{{ appTitle }}</div>
        </template>
        <slot />
      </div>
    </transition>
  `,
  scss: css`
    .__CMP_NAME__ {
      display: flex;
      padding: 1.5px;
      background-color: var(--bbvWinTitlebarBgColor);
      transition: opacity 0.4s ease, transform 0.4s ease;
      position: relative;

      &.trayTeleport {
        background-color: transparent;

        .bbv-button {
          padding-bottom: 3px;
        }
      }

      &.trayTeleport:empty {
        clip-path: inset(0 100%);
      }

      &:hover {
        .app_title {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      &:not(:first-child) {
        margin-left: 12px;
      }

      .app_title {
        position: absolute;
        bottom: calc(100% + 6px);
        padding: 6px 12px;
        font-size: 14px;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        z-index: -1;
        left: 5px;
        transform: translateY(30px) scale(0.2);
        transform-origin: bottom left;
        border-radius: 2px;
        box-shadow: 0px 0px 3px 0px var(--bbvBoxShadowColor2);
        color: var(--bbvAppInnerFgColor);
        background-color: var(--bbvWinTitlebarBgColor);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.86, 0, 0.07, 1);
      }

      .bbv-button {
        color: var(--bbvAppTrayFgColor);
        padding: 2px 4px;
        overflow: hidden;
        white-space: nowrap;
        border-bottom: 2px solid transparent;
        transition: border-color 0.2s ease;
        line-height: 1;
        font-size: 12px;

        &.isOpen {
          border-bottom-color: var(--bbvAppTrayFgColor);
          background-color: var(--bbvButtonHoverBgColor);
        }
      }

      .bbv-button + .bbv-button {
        margin-left: 8px;
      }

      &.appTrayGroupFadeUp-enter-from,
      &.appTrayGroupFadeUp-leave-to {
        opacity: 0;
        transform: translateY(75px);
      }
    }
  `,
}
