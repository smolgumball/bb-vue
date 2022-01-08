import AppFactory from '/bb-vue/AppFactory.js'
import { css, html } from '/bb-vue/lib.js'

/** @param {NS} ns **/
export async function main(ns) {
  /*
    always wrap your AppFactory usage in a try/catch block,
    to get helpful error messages from bb-vue.
  */
  try {
    await new AppFactory('my-first-app', ns)
      /*
        forceReload ensures that the entire bb-vue framework is torn down
        each time you use an AppFactory.

        you probably don't want this once you're done developing your
        bb-vue components, otherwise each script using AppFactory will
        cause the global bb-vue framework to reboot, and will remove all
        other running apps in the process!
      */
      .configure({ forceReload: true })

      /* a root component must ALWAYS be set */
      .setRootComponent(MyAppComponent)

      /* afterwards, you can add as many additional components as you like */
      .addComponents(MyJsonComponent)

      /* and always remember to start the app */
      .start()
  } catch (error) {
    /*
      in case something goes wrong, log it out and halt the program.
      check your Debug -> Activate menu for more info
    */
    console.error(error)
    ns.tprint(error.toString())
    ns.exit()
  }
}

const MyAppComponent = {
  name: 'my-first-root-component',
  /*
    here, we bring in some special functionality offered by the
    core bb-vue framework. this let's us shut down our entire app
    (all the windows, all the sub-components, etc.) with a single
    method call. you can see it's wired to a button at the bottom
    of the bbv-window down below
  */
  inject: ['appSend'],
  template: html`
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
        Or shut everything down:
        <bbv-button @click="appSend('shutdown')">Shutdown App</bbv-button>
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
  scss: css`
    /*
      you can reference the component name with
      __CMP_NAME__and it will be replaced at startup.
      this happens in both templates and style blocks
    */
    .__CMP_NAME__ {
      /*
        this makes it easy to write styles will
        only apply where you want them to
      */
      p {
        margin: 0;
        padding: 25px 0 5px 0;

        /* have you noticed we're writing SCSS? */
        strong {
          font-size: 13px;
          padding: 3px 6px 1px 6px;
          display: inline-block;
          border-radius: 5px;

          /* use the provided CSS theming variables to color your elements */
          /* you can find all of them on the <body> tag */
          color: var(--bbvHackerDarkFgColor);
          background-color: var(--bbvHackerDarkBgColor);
        }

        button {
          margin-top: 10px;
        }
      }
    }
  `,
}

const MyJsonComponent = {
  name: 'my-json-display',
  props: {
    display: {
      required: true,
    },
  },
  template: html`
    <div class="__CMP_NAME__">
      <pre><code>{{ toJson(display) }}</code></pre>
    </div>
  `,
  methods: {
    toJson(value) {
      return JSON.stringify(value, null, '  ')
    },
  },
  scss: css`
    .__CMP_NAME__ {
      background-color: #0000008c;
      color: lawngreen;
      padding: 10px 5px;

      pre,
      code {
        margin: 0;
        font-family: inherit;
        overflow: auto;
      }
    }
  `,
}
