import { css, html } from '/bb-vue/lib.js'

export default {
  name: 'eye-input',
  props: ['modelValue', 'label', 'labelButton', 'placeholder', 'inline'],
  emits: ['update:modelValue', 'activate'],
  template: html`
    <label class="__CMP_NAME__" :class="{ inline: inline !== undefined }">
      <template v-if="label">
        <span>{{ label }}</span>
      </template>
      <input
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        @keydown.enter="$emit('activate')"
        :placeholder="placeholder"
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
      margin-bottom: 12px;

      &.inline {
        margin: 0;
        flex-wrap: initial;

        & > input {
          width: 100%;
        }

        & > span {
          width: auto;
          padding: 0 5px;
        }
      }

      & > span {
        width: 100%;
        color: var(--bbvInputBorderColor);
      }

      & > input {
        width: 75%;
        line-height: 1;
        padding: 5px 0;
        border: none;
        border-bottom: 1px solid var(--bbvInputBorderColor);
        background-color: var(--bbvInputBgColor);
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
