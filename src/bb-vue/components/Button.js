// prettier-ignore
import { css, html } from '/bb-vue/lib.js'

export default {
  name: 'bbv-button',
  template: html`
    <button
      class="__CMP_NAME__"
      :class="{ icon, small }"
      :tabindex="noFocus === false ? undefined : '-1'"
    >
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
    noFocus: {
      default: false,
    },
  },
  scss: css`
    .__CMP_NAME__ {
      font-family: inherit;
      font-size: inherit;
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

      &[disabled]:hover {
        background-color: var(--bbvButtonBgColor);
        cursor: not-allowed;
      }

      &.small {
        padding: 6px;
        font-size: 12px;
        line-height: 1.1;
      }

      &.icon {
        padding: 2px;
        line-height: 1.5;
      }

      & > code {
        padding: 4px 3px;
        background-color: var(--bbvWinActionsBgColor);
        border-radius: 4px;
      }
    }
  `,
}
