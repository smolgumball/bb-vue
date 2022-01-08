import AppFactory from '/bb-vue/AppFactory.js'
import { css, html, setGlobalAppFactoryConfig } from '/bb-vue/lib.js'

/** @param {NS} ns **/
export async function main(ns) {
  /*
    always wrap your AppFactory usage in a try/catch block,
    to get helpful error messages from bb-vue.
  */
  try {
    /*
      you can configure all your AppFactories at once if that's easier.
      note that these configs are _persistent_ and will effect all AppFactory
      instances you try to start until you reload BitBurner! however, you can
      still override each AppFactory using it's configure() method, as seen below
    */
    setGlobalAppFactoryConfig({ showTips: false, forceReload: false })

    /* boot the first app */
    let myAppOneHandleFn = await new AppFactory('my-app-one', ns)
      /*
        let's override our global AppFactory config to force a reload on just
        this first app. this will ensure that this app and the following are the
        only two running inside BitBurner
      */
      .configure({ forceReload: true })
      .setRootComponent(PrimaryAppRoot)
      .start()

    ns.tprint('my-app-one booted!')

    /* wait a bit... */
    await ns.sleep(1000)
    ns.tprint('Waiting 1s and then booting a second app...')

    /*
      notice that we aren't calling `configure` on this second app.
      instead, this AppFactory is inheriting it's configuration options
      from the setGlobalAppFactoryConfig call we made at the top of our script
    */
    let myAppTwoHandleFn = await new AppFactory('my-app-two', ns) /* prettier-ignore */
      .setRootComponent(DifferentAppRoot)
      .start()

    ns.tprint('my-app-two booted!')

    /* wait a bit... */
    await ns.sleep(1000)
    ns.tprint('Waiting 1s and then logging mounted apps to debug console...')

    /* retrieve references to both running apps */
    const [runningAppOne, runningAppTwo] = [myAppOneHandleFn(), myAppTwoHandleFn()]

    /* display in debug console (Debug -> Activate) */
    console.debug(runningAppOne)
    console.debug(runningAppTwo)
  } catch (error) {
    /* in case something goes wrong, log it out and halt the program */
    console.error(error)
    ns.tprint(error.toString())
    ns.exit()
  }
}

const PrimaryAppRoot = {
  name: 'primary-app-root',
  inject: ['appShutdown'],
  template: html`
    <bbv-window
      ref="myWindow"
      class="__CMP_NAME__"
      title="Hello from my-app-one!"
      :app-tray-config='{ title: "✅" }'
    >
      <p>Beep boop</p>
      <template #actions>
        <bbv-button @click="appShutdown">Shutdown App</bbv-button>
      </template>
    </bbv-window>
  `,
  data() {
    return {
      appTrayConfig: {
        showWindows: false,
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
      <bbv-window
        class="__CMP_NAME__"
        title="Hello from my-app-two, window #1!"
        :app-tray-config="{ title: '🥇' }"
      >
        <p>Boop beep</p>
        <template #actions>
          <bbv-button @click="appShutdown">Shutdown App</bbv-button>
        </template>
      </bbv-window>
      <bbv-window
        class="__CMP_NAME__"
        title="Hello from my-app-two, window #2!"
        :app-tray-config="{ title: '🥈' }"
      >
        <p>Boop beep</p>
        <template #actions>
          <bbv-button @click="appShutdown">Shutdown App</bbv-button>
        </template>
      </bbv-window>
    </main>
  `,
  data() {
    return {
      appTrayConfig: {
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
