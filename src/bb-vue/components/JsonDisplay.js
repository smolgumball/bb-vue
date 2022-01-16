// prettier-ignore
import { css, html, toJson } from '/bb-vue/lib.js'

export default {
  name: 'bbv-json-display',
  template: html`
    <div class="__CMP_NAME__" :class="{ fill: fill !== false, wrap: wrap !== false }">
      <div class="json_inner">{{ toJson(data) }}</div>
    </div>
  `,
  props: {
    data: {
      default: {},
    },
    fill: {
      default: false,
    },
    wrap: {
      default: false,
    },
  },
  methods: { toJson },
  scss: css`
    .__CMP_NAME__ {
      &.fill {
        height: 100%;

        .json_inner {
          height: 100%;
          max-height: unset;
        }
      }

      &.wrap {
        .json_inner {
          white-space: pre-wrap;
        }
      }

      .json_inner {
        @include bbv-scrollbar;

        padding: 10px 5px;
        width: 100%;
        max-height: 300px;
        overflow: auto;
        white-space: pre;
        color: var(--bbvHackerDarkFgColor);
        background-color: var(--bbvHackerDarkBgColor);
        border-radius: 5px;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
    }
  `,
}
