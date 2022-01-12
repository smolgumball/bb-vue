# bb-vue

Use Vue inside BitBurner!

![bitburner_jmT3LDJN0J](https://user-images.githubusercontent.com/53015256/147802003-5aba9bc9-6ef9-4902-b4a1-0d6c5286672a.png)

## In Development

Most recent changes for those who want to browse the source:
* Take a [peek at the `/src/bb-vue/*` tree](https://github.com/smolgumball/bb-vue/tree/dev/src/bb-vue) of the `dev` branch
* Pop over here and [heed the call for testers](https://github.com/smolgumball/bb-vue/issues/11) if you'd like to lend a hand in shaping the growth of `bb-vue` with your feedback

## Stable / Legacy Installation

Copy contents of `install.js` from this repo into your BitBurner game and run to install!

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

* Please create a GitHub issue if you run into any snags with installation or use. 
* If anything crashes, kill the script pid and run `_smolGumball.ui.vueApp.unmount()` in devtools / debug console to tear it down. 
  * Doing a hard restart of your game will work too. 
