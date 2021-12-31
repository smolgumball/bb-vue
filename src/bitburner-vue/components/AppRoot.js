import { css, html, projectGlobals, setAppVisible, emitEvent } from '/bitburner-vue/lib.js'

export default {
  name: 'app-root',
  globalStyle: css`
    body {
      --sglBorderColor: #76a6c7b0;
      --sglBoxShadowColor1: #378a7b42;
      --sglBoxShadowColor2: #1c2a3cc9;
      --sglAppInnerBgColor: #002b36;
      --sglCardBgColor: #{fade-out(white, 0.95)};
      --sglCardHeight: 40vh;
      --sglFontLightColor: white;
      --sglButtonBgColor: #104d5d;
      --sglButtonHoverBgColor: #217184;
    }
  `,

  style: css`
    & {
      font-family: 'Lucida Console', monospace;
      font-weight: 400;
      font-size: 0.8rem;
      line-height: 1.2;

      * {
        box-sizing: border-box;
      }
    }

    .layout {
      z-index: 1400;

      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;

      display: flex;
      pointer-events: none;

      &.isOpen {
        .inner {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
      }
    }

    .inner {
      width: 100%;
      margin-left: 250px;
      padding: 1em;
      border-left: 2px double var(--sglBorderColor);
      color: var(--sglFontLightColor);
      background-color: var(--sglAppInnerBgColor);
      box-shadow: inset 0px 0px 30px 10px var(--sglBoxShadowColor1), 0px 0px 40px 20px var(--sglBoxShadowColor2);
      overflow: auto;
      opacity: 0;
      transition: transform 0.35s ease, opacity 0.35s ease;
      transform: translateY(-30px);
    }

    .trigger {
      z-index: 1500;

      position: fixed;
      bottom: 2px;
      left: 1px;
      width: 248px;
      height: auto;

      display: flex;
      justify-content: space-evenly;
      padding: 1.25em 0;

      box-shadow: inset 0px 0px 10px 5px var(--sglBoxShadowColor1);
      background-color: var(--sglAppInnerBgColor);

      button:first-child {
        width: 135px;
      }
    }

    /**
     * Global styles for use in all child components
    */

    .sgl--json_display {
      padding: 0.8em;
      overflow: auto;
      white-space: pre;
      font-family: monospace;
      color: lawngreen;
      background-color: black;
    }

    .sgl--enable_scrollbar,
    .sgl--json_display {
      &::-webkit-scrollbar {
        display: initial;
        width: 4px;
        height: 4px;
      }

      &::-webkit-scrollbar-track {
        background-color: var(--sglButtonBgColor);
      }

      &::-webkit-scrollbar-thumb {
        background-color: var(--sglButtonHoverBgColor);
      }
    }

    .sgl--button {
      font-family: inherit;
      line-height: inherit;
      font-size: inherit;

      text-align: center;
      padding: 0.95em 0.935em;
      border: none;

      cursor: pointer;
      color: var(--sglFontLightColor);
      background-color: var(--sglButtonBgColor);
      transition: background-color 0.6s ease;

      &:hover {
        background-color: var(--sglButtonHoverBgColor);
      }

      &.sgl--button-sm {
        font-size: 0.85em;
        padding: 0.4em 0.6em;
      }
    }
  `,
  template: html`
    <div class="app_root">
      <div class="layout" :class="{ isOpen }">
        <div class="inner">
          <command-palette />
          <store-display />
        </div>
      </div>
      <div class="trigger">
        <button class="sgl--button" @click="toggleDisplay">{{toggleWord}} Dashboard</button>
        <button class="sgl--button" @click="rebootApp">Reboot</button>
      </div>
    </div>
  `,
  data() {
    return {}
  },
  computed: {
    store() {
      return projectGlobals.store.data
    },
    isOpen() {
      return this.store.uiState.isAppOpen
    },
    toggleWord() {
      return this.isOpen ? 'Hide' : 'Open'
    },
  },
  mounted() {
    setTimeout(() => {
      setAppVisible(true)
    }, 1000)
  },
  methods: {
    toggleDisplay() {
      this.store.uiState.isAppOpen = !this.isOpen
    },
    rebootApp() {
      emitEvent('commandPalette:run', { commandSlug: 'reboot-application' })
    },
  },
}
