import { css, html } from '/bb-vue/lib.js'

export default {
  name: 'bbv-button',
  template: html`
    <button class="__CMP_NAME__" :class="{ icon, small }">
      <slot />
    </button>
  `,
  props: {
    icon: {
      type: Boolean,
      default: false,
    },
    small: {
      type: Boolean,
      default: false,
    },
  },
  scss: css`
    .__CMP_NAME__ {
      font-family: inherit;
      font-size: inherit;
      font-weight: 600;
      font-size: 14px;
      padding: 8px;
      cursor: pointer;
      border: none;
      border-radius: 2px;
      color: var(--bbvButtonFgColor);
      background-color: var(--bbvButtonBgColor);
      margin: 0;
      transition: color 0.15s, background-color 0.3s;

      &:hover {
        color: var(--bbvButtonHoverFgColor);
        background-color: var(--bbvButtonHoverBgColor);
      }

      &.small {
        padding: 6px;
        font-size: 12px;
        line-height: 1.1;
        font-weight: normal;
      }

      &.icon {
        padding: 2px;
        line-height: 1.5;
        font-weight: normal;
      }
    }
  `,
}
