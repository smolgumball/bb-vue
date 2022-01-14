import { css, html } from '/bb-vue/lib.js'

export default {
  name: 'eye-input',
  props: ['modelValue', 'label', 'labelButton'],
  emits: ['update:modelValue', 'activate'],
  template: html`
    <label class="__CMP_NAME__">
      <span>{{ label }}</span>
      <input
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @keydown.enter="$emit('activate')"
      />
      <template v-if="labelButton">
        <bbv-button no-focus @click="$emit('activate')" class="action">
          {{ labelButton }}
        </bbv-button>
      </template>
    </label>
  `,
  scss: css`
    .__CMP_NAME__ {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 10px;

      & > span {
        font-size: 14px;
        width: 100%;
      }

      & > input {
        width: 75%;
        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        line-height: 1;
        padding: 5px;
        border: none;
        border-bottom: 2px solid var(--bbvInputBorderPositiveColor);
        background-color: var(--bbvHackerDarkAltBgColor);
        color: var(--bbvHackerDarkFgColor);

        &:focus {
          outline: none;
        }
      }

      & > .action {
        width: 20%;
      }
    }
  `,
}
