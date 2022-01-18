// prettier-ignore
import { doc, lodash, Vue, VueUse, win } from '/bb-vue/lib.js'

export default async function useDraggableWin(store, options = {}) {
  const { reactive, nextTick } = Vue()
  const { useDraggable, useElementBounding, useIntervalFn, until } = VueUse()

  // Handle options + validations
  let opts = reactive({
    winManager: null,
    dragHandleRef: null,
    draggableRef: null,
    dragIgnoreRef: null,
    startPosition: null,
    constrain: true,
    constrainPadding: 0,
    ...lodash.omitBy(options, lodash.isNil),
  })
  if (!lodash.isObjectLike(store)) {
    throw new Error('Must provide store as first arg')
  }
  if (!lodash.isObjectLike(opts.winManager)) {
    throw new Error('Must provide winManager in options')
  }
  if (!opts.dragHandleRef) {
    throw new Error('Must provide dragHandleRef in options')
  }
  if (!opts.draggableRef) {
    throw new Error('Must provide draggableRef in options')
  }

  // Fill provided store with initial state
  store.clampedFlag = false
  store.isDragging = false
  store.position = {}
  store.size = {}
  store.fixedRoot = useElementBounding(doc.querySelector('[bbv-root]'))
  store.draggableTarget = useElementBounding(opts.draggableRef)

  // Wait until draggableTarget is mounted, might be a better way?
  await until(store.draggableTarget).toMatch((x) => x.width > 0)

  // Sync minWidth / minHeight from CSS styles applied to window
  store.minWidth = parseInt(win.getComputedStyle(opts.draggableRef).minWidth)
  store.minHeight = parseInt(win.getComputedStyle(opts.draggableRef).minHeight)

  // Wire draggable handle to allow window dragging via dragHandleRef
  store.isDragging = useDraggable(opts.dragHandleRef, {
    initialValue: constrainWindow(opts.startPosition ?? store.position, { store, opts }).position,
    onMove: (p) => updateStore(p, { store, opts }),
    onStart: (p, e) => !e.path.some((x) => x == opts.dragIgnoreRef),
  }).isDragging

  // Position immediately to avoid nulls
  await nextTick()
  updateStore({ x: 0, y: 0 }, { store, opts })

  // Set initial position, if none is provided, based on winManager recommendation
  if (!opts.startPosition) {
    store.position = opts.winManager.getRecommendedPosition(store)
    updateStore(store.position, { store, opts })
  } else {
    updateStore(opts.startPosition, { store, opts })
  }

  // Set initial position to center of screen
  // store.position = {
  //   x: store.fixedRoot.width / 2 - store.draggableTarget.width / 2,
  //   y: store.fixedRoot.height / 2 - store.draggableTarget.height / 2,
  // }

  // Add a running check to ensure window stays within boundary
  // Auto-shuts-down once DOM node is no longer present
  const { pause: pauseConstrain } = useIntervalFn(() => {
    if (!opts.draggableRef?.isConnected) {
      pauseConstrain()
      return
    }

    let constrained = constrainWindow(store.position, { store, opts })
    store.position = constrained.position
    store.size = constrained.size
    updateStore(store.position, { store, opts })
  }, 250)
}

function updateStore(curPos, ctx) {
  // Clamp window size and position if desired
  if (ctx.opts.constrain) {
    const { size, position } = constrainWindow(curPos, ctx)
    ctx.store.position = position
    ctx.store.size = size
  }

  // Update style object to be bound to draggableTarget in consumer template
  ctx.store.style = {
    left: `${ctx.store.position.x}px`,
    top: `${ctx.store.position.y}px`,
    width: `${ctx.store.size.width}px`,
    height: `${ctx.store.size.height}px`,
  }
}

function constrainWindow(curPos, ctx) {
  const { useClamp } = VueUse()

  let pos = { x: 0, y: 0 }
  let size = { width: 0, height: 0 }
  let padding = ctx.opts.constrainPadding

  let root = ctx.store.fixedRoot
  let draggable = ctx.store.draggableTarget

  size.width = useClamp(draggable.width, ctx.store.minWidth, root.width - padding * 2)
  size.height = useClamp(draggable.height, ctx.store.minHeight, root.height - padding * 2)

  pos.x = useClamp(curPos.x, padding, root.width - size.width.value - padding)
  pos.y = useClamp(curPos.y, padding, root.bottom - size.height.value - padding)

  return {
    position: pos,
    size,
  }
}
