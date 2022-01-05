import AppFactory from '/bb-vue/AppFactory.js'
import { css, html, setConfig } from '/bb-vue/lib.js'

/** @param {NS} ns **/
export async function main(ns) {
  await new AppFactory('my-first-app', ns)
    /* provide configuration options as needed */
    .configure({})
    /* a root component must ALWAYS be set */
    .setRootComponent(MyAppComponent)
    /* afterwards, you can add as many additional components as you like */
    .addComponents(MyJsonComponent)
    /* and always remember to start the app */
    .start()
}

const MyAppComponent = {
  name: 'my-first-root-component',
  scss: css`
    /*
    You can reference the component name with
    __CMP_NAME__and it will be replaced at startup
    */
    .__CMP_NAME__ {
      /*
      This makes it easy to write styles will
      only apply where you want them to
      */
      p {
        margin: 0;
        padding: 25px 0 5px 0;

        strong {
          font-size: 13px;
          padding: 3px 6px 1px 6px;
          display: inline-block;
          border-radius: 5px;

          /*
          Use the provided CSS variables to color your elements
          */
          color: var(--bbvHackerDarkFgColor);
          background-color: var(--bbvHackerDarkBgColor);
        }

        button {
          margin-top: 10px;
        }
      }
    }
  `,
  template: html`
    <!--
      You can also reference the component name in your templates!
      e.g. class="__CMP_NAME__" will become class="my-first-root-component" on startup
    -->
    <bbv-window class="__CMP_NAME__" title="Hello from bb-vue!">
      <p>Render your own components:</p>
      <my-json-display :display="myData" />

      <p>Or use the built-in components:</p>
      <bbv-json-display :data="jsonData" />

      <p>
        Update your app's data store: <strong>{{ myData.ezCounter }}</strong><br />
        <bbv-button @click="myData.ezCounter++">Add 1</bbv-button>
      </p>

      <template #actions>
        <bbv-button @click="$send('app:shutdown', this)">Shutdown App</bbv-button>
      </template>
    </bbv-window>
  `,
  data() {
    return {
      myData: { 'bb-vue-is': 'easy to use!', ezCounter: 0 },
      jsonData: {
        'bb-vue-components': 'NICE.exe',
        otherFeatures: ['SCSS support', 'App tray', 'NetScript communication', '...and more!'],
      },
    }
  },
}

const MyJsonComponent = {
  name: 'my-json-display',
  scss: css`
    .__CMP_NAME__ {
      background-color: #0000008c;
      color: lawngreen;
      padding: 10px 5px;

      pre,
      code {
        margin: 0;
        font-family: inherit;
      }
    }
  `,
  template: html`
    <div class="__CMP_NAME__">
      <pre><code>{{ toJson(display) }}</code></pre>
    </div>
  `,
  props: ['display'],
  methods: {
    toJson(value) {
      return JSON.stringify(value, null, '  ')
    },
  },
}
