# bb-vue

**Use Vue inside BitBurner!** 

- Built with Vue 3 and SCSS support
- Includes an app tray for all your apps
- Window manager to drag, minimize, and dynamically position windows
- Various components to help you get started

From custom UI extensions to reactive data storage, hacking in BitBurner has never been easier 😎
<br>
<br>

![image](https://user-images.githubusercontent.com/53015256/149429912-798a70a2-44ce-4692-ac90-09dbdc4ccf3b.png)

## Getting Started

* Move to home device, root dir in game
* `nano bbv-inst.js`
  * Copy in script from [install.js](https://raw.githubusercontent.com/smolgumball/bb-vue/dev/install.js) and save
* Back to terminal
  * `run /bbv-inst.js dev` 👈 _make sure to include the `dev` argument!_
  * `run /bb-vue/examples/0-getting-started.js`
* Run bb-vue
  * `run /bb-vue/examples/1-the-app-tray.js`
* Explore examples
  * `nano /bb-vue/examples/0-getting-started.js`
  * `nano /bb-vue/examples/1-the-app-tray.js`
* Open an issue if you run into any problems, or hit me up in [the BitBurner discord](https://discord.gg/XKEGvHqVr3).

## In Development

Most recent changes for those who want to browse the source:
* Take a [peek at the `/src/bb-vue/*` tree](https://github.com/smolgumball/bb-vue/tree/dev/src/bb-vue) of the `dev` branch
* Pop over here and [heed the call for testers](https://github.com/smolgumball/bb-vue/issues/11) if you'd like to lend a hand in shaping the growth of `bb-vue` with your feedback

## Changelog

### `dev`

* A new architecture that allows for more user-control
* Beginnings of a component library for creating UIs quickly
* Active development, be warned, but [feel free to contribute](https://github.com/smolgumball/bb-vue/issues/11) as well!

### v0.0.1

* An actual GitHub repo!
* Something of a proper architecture, but still very WIP...
  * An `Orchestrator` class with a tick rate, a command queue, and extensive callback support
  * An `EventBus` class for communicating across modules
  * A reactive `Store` class for syncing NetScript and Vue UI layers
  * A `UI` class for bootstrapping the demo Vue app and mounting it
* An example `CommandPalette` component which creates async NetScript commands to be run by the `Orchestrator` and reports on their status
* All UI components are now imported from their own files! Almost like Vue SFCs, but decidedly more punk
* The beginnings of a central dashboard (something of an example of what can be done with the library thus far)

## Troubleshooting

* Please create a GitHub issue if you run into any snags with installation or use, or reach out to me on [the BitBurner discord](https://discord.gg/XKEGvHqVr3).
