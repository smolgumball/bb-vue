# `bitburner-vue` <small>is now</small> [`bb-vue`](https://github.com/smolgumball/bb-vue/tree/dev#readme)

For the `latest bb-vue developments` please [`see the dev branch`](https://github.com/smolgumball/bb-vue/tree/dev#readme)

<br>
<br>
<br>
<br>
<br>
<br>

<details><summary><code>Click Here</code> for The Old Stuff 🚧</summary>
<p>

Use Vue inside BitBurner!

![bitburner_jmT3LDJN0J](https://user-images.githubusercontent.com/53015256/147802003-5aba9bc9-6ef9-4902-b4a1-0d6c5286672a.png)

## Legacy Installation

Copy contents of [`install.js`](install.js) from the `main` branch into your BitBurner game and run to install!

## Changelog

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
