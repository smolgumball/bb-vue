import AppFactory from '/bb-vue/AppFactory.js'
import { css, html, setConfig } from '/bb-vue/lib.js'

/** @param {NS} ns **/
export async function main(ns) {
  /* you can configure all your AppFactories at once if that's easier */
  setConfig({ showTips: false })

  /* boot the first app */
  await new AppFactory('my-app-one', ns).setRootComponent(MyAppOneComponent).start()
  ns.tprint('my-app-one booted!')

  /* wait a bit... */
  await ns.sleep(1000)
  ns.tprint('Waiting 1s...')

  /* and then boot the second */
  await new AppFactory('my-app-two', ns).setRootComponent(MyAppTwoComponent).start()
  ns.tprint('my-app-two booted!')

  /*
    watch the app tray grow as your apps come online!
    think of how you could boot apps from scripts all across your game, as needed!
  */
}

const MyAppOneComponent = {
  name: 'my-app-one-root',
  scss: css`
    .__CMP_NAME__ {
      p {
        margin: 0;
        padding: 25px 0 5px 0;
      }
    }
  `,
  template: html`
    <bbv-window class="__CMP_NAME__" title="Hello from my-app-one!">
      <p>Beep bop</p>
      <template #actions>
        <bbv-button @click="$send('app:shutdown', this)">Shutdown App</bbv-button>
      </template>
    </bbv-window>
  `,
}

const MyAppTwoComponent = {
  name: 'my-app-two-root',
  scss: css`
    .__CMP_NAME__ {
      p {
        margin: 0;
        padding: 25px 0 5px 0;
      }
    }
  `,
  template: html`
    <bbv-window class="__CMP_NAME__" title="Hello from my-app-one!">
      <p>Bop beep</p>
      <template #actions>
        <bbv-button @click="$send('app:shutdown', this)">Shutdown App</bbv-button>
      </template>
    </bbv-window>
  `,
}
