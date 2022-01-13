/**
 * @see: Learn more about Vue here: https://v3.vuejs.org/
 * @see: Learn more about Sass here: https://sass-lang.com/
 * @see: Learn more about bb-vue here: https://github.com/smolgumball/bb-vue
 */

// Start with a single import from the bb-vue library
import AppFactory from '/bb-vue/AppFactory.js'

/**
 * These functions are used to enable nicer syntax highlighting of HTML/CSS in VSCode.
 * Specifically the `prettier - code formatter`, `es6-string-css` and `es6-string-html`
 * extensions can be used.You can safely remove these imports, as long as you remove references to them below.
 **/

// prettier-ignore
import { css, html } from '/bb-vue/lib.js'

// Note the standard BitBurner function signature here.
// Always start your bb-vue apps from standard BitBurner scripts since you will
// need to pass a valid NS instance to the AppFactory constructor!

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
  // Wrap your AppFactory usage with try/catch for better error messages
  try {
    const myAppFactory = new AppFactory(ns)
    const myAppHandleFn = await myAppFactory.mount({
      // An app ID is always required
      config: { id: 'my-first-app' },

      // Additional components are optional.
      // Here, we're adding just one extra
      components: [MyJsonComponent],

      // A root component is always required
      rootComponent: MyAppComponent,
    })

    // You can retrieve a reference to your root component
    // by running the function returned from mount()
    console.debug(myAppHandleFn())
  } catch (error) {
    // In case something goes wrong, log it out and halt the program
    console.error(error)
    ns.tprint(error.toString())
    ns.exit()
  }
}

const MyAppComponent = {
  // Every component needs a unique name
  name: 'my-first-root-component',

  // Here, we "inject" a helper function provided by the bb-vue library.
  // Running this function shuts down your entire app. It is wired to a button
  // click at the bottom of the bbv-win component, in the #actions slot!
  inject: ['appShutdown'],

  // Your template is where a lot of the magic happens. Render DOM elements here,
  // and use various Vue-specific techniques like `v-for`, @event binding, etc.
  // Learn more about Vue here: https://v3.vuejs.org/
  template: html`
    <bbv-win class="__CMP_NAME__" title="Hello from bb-vue!">
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
        <bbv-button @click="appShutdown">Shutdown App</bbv-button>
      </template>
    </bbv-win>
  `,

  // The data function tells Vue what kind of reactive data you'd like to use.
  // Changing these values from inside or outside the component will cause the
  // component to update automatically! Learn more about Vue here: https://v3.vuejs.org/
  data() {
    return {
      myData: { 'bb-vue-is': 'easy to use!', ezCounter: 0 },
      jsonData: {
        'bb-vue-components': 'NICE.exe',
        otherFeatures: ['SCSS support', 'App tray', 'NetScript communication', '...and more!'],
      },
    }
  },

  // The scss key is where you define the styles for your component.
  scss: css`
    /*
      You can reference your component name with __CMP_NAME__and it
      will be replaced at startup. This happens in both templates and style blocks!
    */
    .__CMP_NAME__ {
      p {
        margin: 0;
        padding: 25px 0 5px 0;

        /*
          Have you noticed we're writing SCSS? bb-vue supports Sass 0.11.1
          through the sass.js tool; a bit outdated now, but good enough for some
          dank BitBurner components. Learn more about sass.js here:
          https://github.com/medialize/sass.js/#sassjs
        */
        strong {
          font-size: 13px;
          padding: 3px 6px 1px 6px;
          display: inline-block;
          border-radius: 5px;

          /*
            You can use the provided CSS theming variables to color your elements.
            Find all of them on the <body> tag of your BitBurner debug / devtools console.
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
}

// Here's a simple supporting component that displays data passed to it.
// It converts the data to a JSON string and then display it in the whitespace
// sensitive HTML tag <pre>
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
