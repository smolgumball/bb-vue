import AppFactory from '/bb-vue/AppFactory.js'
import { css, html, setGlobalAppFactoryConfig } from '/bb-vue/lib.js'

/** @param {NS} ns **/
export async function main(ns) {
  /*
    you can configure all your AppFactories at once if that's easier.
    note that these configs are _persistent_ and will effect all AppFactory
    instances you try to start until you reload BitBurner! however, you can
    still override each AppFactory using it's configure() method, as seen below
  */
  setGlobalAppFactoryConfig({ showTips: false, forceReload: false })

  /* boot the first app */
  await new AppFactory('my-app-one', ns)
    /*
      let's override our global AppFactory config to force a reload on just
      this first app. this will ensure that this app and the following are the
      only two running inside BitBurner
    */
    .configure({ forceReload: true })
    .setRootComponent(MyAppOneComponent)
    .start()

  ns.tprint('my-app-one booted!')

  /* wait a bit... */
  await ns.sleep(1000)
  ns.tprint('Waiting 1s...')

  /*
    notice that we aren't calling `configure` on this second app.
    instead, this AppFactory is inheriting it's configuration options
    from the global AppFactory configuration we set at the top of our script
  */
  await new AppFactory('my-app-two', ns).setRootComponent(MyAppTwoComponent).start()
  ns.tprint('my-app-two booted!')

  /*
    watch the app tray grow as your apps come online!
    think of how you could boot apps from scripts all across your game, as needed!
  */
}

const MyAppOneComponent = {
  name: 'my-app-one',
  inject: ['appSend'],
  template: html`
    <bbv-window
      ref="myWindow"
      class="__CMP_NAME__"
      title="Hello from my-app-one!"
      :app-tray-config='{ title: "[1:1]" }'
    >
      <p>Beep boop</p>
      <template #actions>
        <bbv-button @click="appSend('shutdown')">Shutdown App</bbv-button>
      </template>
    </bbv-window>
  `,
  data() {
    return {
      appTrayConfig: {
        title: 'My App #1',
        showWindows: true,
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

const MyAppTwoComponent = {
  name: 'my-app-two',
  inject: ['appSend'],
  template: html`
    <bbv-window
      class="__CMP_NAME__"
      title="Hello from my-app-two, window #1!"
      :app-tray-config="{ title: '[2:1]' }"
    >
      <p>Boop beep</p>
      <template #actions>
        <bbv-button @click="appSend('shutdown')">Shutdown App</bbv-button>
      </template>
    </bbv-window>

    <bbv-window
      class="__CMP_NAME__"
      title="Hello from my-app-two, window #2!"
      :app-tray-config="{ title: '[2:2]' }"
    >
      <p>Boop beep</p>
      <template #actions>
        <bbv-button @click="appSend('shutdown')">Shutdown App</bbv-button>
      </template>
    </bbv-window>
  `,
  data() {
    return {
      appTrayConfig: {
        title: 'My App #2',
        showWindows: true,
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
