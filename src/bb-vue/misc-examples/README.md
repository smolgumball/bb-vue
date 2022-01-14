# misc. integration examples
> inspired by community projects + discussions
<br>

## asciichart window example

![image](https://user-images.githubusercontent.com/53015256/149457675-a362a055-556c-42d3-90cd-372c37b2f1c8.png)

this example uses an ASCII chart library to push a standard array of values into a `<bb-win>` window component. it bundles
a nice monospace font called `FreeMono` which helps render these ASCII charts smoothly.

the graph will auto-pause when hovered over so you can scroll and inspect, and then resume & fast-forward to catch up
with any events that may have been buffered while paused.

* `run asciichart-ui.js`
* `run asciichart-collector.js`
* enjoy 🎉

## svgchart window example

![image](https://user-images.githubusercontent.com/53015256/149592298-4e81a354-208a-48a5-a70e-54f32d55c3cf.png)

this example shows how to create a DOM target within a `<bb-win>` component, and then inject raw DOM elements into it from
another script. specifically, a big ol' SVG chart that's built in `svgchart-builder.js`.

this doesn't so much show off the reactive nature of Vue's data binding, but instead shows how
various `bb-vue` UI can be setup to co-exist with other, more traditional DOM manipulation techniques.

* `run svgchart-ui.js`
* `run svgchart-builder.js`
* enjoy 🎉
