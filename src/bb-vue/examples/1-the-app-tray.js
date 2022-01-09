import AppFactory from '/bb-vue/AppFactory.js'
import { css, html } from '/bb-vue/lib.js'

/** @param {NS} ns **/
export async function main(ns) {
  try {
    // App one
    // ---

    let appOne = new AppFactory(ns)
    const appOneHandleFn = await appOne.mount({
      config: { id: 'app-one' },
      rootComponent: PrimaryAppRoot,
    })

    ns.tprint('app-one booted!')

    // Wait a bit...
    await ns.sleep(1000)
    ns.tprint('Waiting 1s and then booting a second app...')

    // App two
    // ---

    let appTwo = new AppFactory(ns)
    const appTwoHandleFn = await appTwo.mount({
      config: { id: 'app-two' },
      rootComponent: DifferentAppRoot,
    })

    ns.tprint('app-two booted!')

    // Wait a bit...
    await ns.sleep(1000)
    ns.tprint('Waiting 1s and then logging mounted apps to debug console...')

    // Retrieve references to both running apps using the handle / lookup functions
    // returned from the mount() method calls earlier.
    const [runningAppOne, runningAppTwo] = [appOneHandleFn(), appTwoHandleFn()]

    // Display running app info in debug console / devtools (Debug -> Activate)
    console.debug(runningAppOne)
    console.debug(runningAppTwo)
  } catch (error) {
    console.error(error)
    ns.tprint(error.toString())
    ns.exit()
  }
}

const PrimaryAppRoot = {
  name: 'primary-app-root',
  inject: ['appShutdown'],
  template: html`
    <bbv-win ref="myWin" class="__CMP_NAME__" title="Hello from my-app-one!">
      <p>Beep boop</p>
      <template #actions>
        <bbv-button @click="appShutdown">Shutdown App</bbv-button>
      </template>
    </bbv-win>
  `,
  data() {
    return {
      // Don't display windows from this app in the app tray
      appTrayConfig: {
        showWins: false,
      },
    }
  },
  scss: css`
    .__CMP_NAME__ {
      p {
        margin: 0;
        padding: 25px 0 5px 0;
      }
    }
  `,
}

const DifferentAppRoot = {
  name: 'secondary-app-root',
  inject: ['appShutdown'],
  template: html`
    <main>
      <!--
        Use the "app-tray-config" prop to show a specific title
        when this window is minimized in the app tray
      -->
      <bbv-win
        class="__CMP_NAME__"
        title="Hello from my-app-two, win #1!"
        :app-tray-config="{ title: '🥇' }"
      >
        <p>Boop beep</p>
        <template #actions>
          <bbv-button @click="appShutdown">Shutdown App</bbv-button>
        </template>
      </bbv-win>

      <!--
        Use the "app-tray-config" prop to show a specific title
        when this window is minimized in the app tray
      -->
      <bbv-win
        class="__CMP_NAME__"
        title="Hello from my-app-two, win #2!"
        :app-tray-config="{ title: '🥈' }"
      >
        <p>Boop beep</p>
        <template #actions>
          <bbv-button @click="appShutdown">Shutdown App</bbv-button>
        </template>
      </bbv-win>
    </main>
  `,
  data() {
    return {
      appTrayConfig: {
        // Display windows from this app in the app tray normally (default)
        showWins: true,
      },
    }
  },
  scss: css`
    .__CMP_NAME__ {
      p {
        margin: 0;
        padding: 25px 0 5px 0;
      }
    }
  `,
}
