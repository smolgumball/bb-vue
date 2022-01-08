import { css, html } from '/bb-vue/lib.js'
import AppFactory from '/bb-vue/AppFactory.js'

const ScssResources = css`
  @mixin fixedModal() {
    position: fixed;
    z-index: 1500;
    top: 200px;
    left: 200px;
  }
`

const AppRootComponent = {
  name: 'bbv-app-root',
  css: css`
    .__CMP_NAME__ {
      font-style: italic;
    }
  `,
  scss: css`
    .__CMP_NAME__ {
      @include fixedModal();

      font-variant: small-caps;

      h2 {
        font-size: 2em;
      }
    }
  `,
  template: html`
    <div class="__CMP_NAME__">
      <h2>Hello there</h2>
      <p>{{ helloTest }}</p>
      <bbv-dumbo />
    </div>
  `,
  props: {
    helloTest: {
      type: String,
      default: '[Not Provided]',
    },
  },
}

const DumboComponent = {
  name: 'bbv-dumbo',
  css: css`
    .__CMP_NAME__ {
      border: 10px solid hotpink;
    }
  `,
  scss: css`
    .__CMP_NAME__ {
      color: red;
      background-color: navajowhite;
    }
  `,
  template: html`
    <div class="__CMP_NAME__">
      <blockquote>Dumbo cmp here</blockquote>
      <h4>Hello from __APP_ID__</h4>
      <code>{{ otherTest }}</code>
    </div>
  `,
  props: {
    otherTest: {
      type: String,
      default: '[Also Not Provided]',
    },
  },
}

/** @param {NS} ns **/
export async function main(ns) {
  const appFactory = new AppFactory('bbVueTestApp', ns)
    .configure({
      rootStoreInitialState: {
        appCounter: 0,
      },
    })
    .setRootComponent(AppRootComponent)
    .addComponents(AppRootComponent, DumboComponent)
    .addScssResources(ScssResources)

  let appInstance = await appFactory.start()

  console.log(appInstance)
}
