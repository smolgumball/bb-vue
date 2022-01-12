import { css, html } from '/bb-vue/lib.js'

export default {
  name: 'bbv-app-tray-group',
  template: html`
    <transition name="appTrayGroupFadeUp" appear>
      <div class="__CMP_NAME__">
        <slot />
      </div>
    </transition>
  `,

  scss: css`
    .__CMP_NAME__ {
      display: flex;
      padding: 4px;
      box-shadow: 0px 0px 4px 1px var(--bbvBoxShadowColor2);
      background-color: var(--bbvWinTitlebarBgColor);
      transition: opacity 0.4s ease, transform 0.4s ease;

      &:not(:first-child) {
        margin-left: 12px;
      }

      &.appTrayGroupFadeUp-enter-from,
      &.appTrayGroupFadeUp-leave-to {
        opacity: 0;
        transform: translateY(75px);
      }
    }
  `,
}
