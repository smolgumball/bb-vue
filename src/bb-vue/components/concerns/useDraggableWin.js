import { doc, lodash, Vue, VueUse, win } from '/bb-vue/lib.js'

export default async function useDraggableWin(store, options = {}) {
  const { reactive, nextTick } = Vue()
  const { useDraggable, useElementBounding, useIntervalFn, until } = VueUse()

  // Handle options + validations
  let opts = reactive({
    dragHandleRef: null,
    draggableRef: null,
    dragIgnoreRef: null,
    startPosition: { x: 0, y: 0 },
    startPositionOffset: { x: 0, y: 0 },
    constrain: true,
    constrainPadding: 0,
    minWidth: 0,
    minHeight: 0,
    ...lodash.omitBy(options, lodash.isNil),
  })

  if (!lodash.isObjectLike(store)) {
    throw new Error('Must provide store as first arg')
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
  await until(store.draggableTarget).toMatch((x) => x.width > 0, {
    timeout: 50,
    throwOnTimeout: true,
  })

  // Sync minWidth / minHeight from CSS styles applied to window
  opts.minWidth = parseInt(win.getComputedStyle(opts.draggableRef).minWidth)
  opts.minHeight = parseInt(win.getComputedStyle(opts.draggableRef).minHeight)

  // Set initial position to center of screen
  store.position = {
    x: store.fixedRoot.width / 2 - store.draggableTarget.width / 2,
    y: store.fixedRoot.height / 2 - store.draggableTarget.height / 2,
  }
  if (opts.startPositionOffset) {
    store.position.x += opts.startPositionOffset?.x ?? 0
    store.position.y += opts.startPositionOffset?.y ?? 0
  }

  const onMove = (p) => updateStore(p, { store, opts })
  const onStart = (p, e) => !e.path.some((x) => x == opts.dragIgnoreRef)

  // Wire draggable handle to allow window dragging via dragHandleRef
  store.isDragging = useDraggable(opts.dragHandleRef, {
    initialValue: constrainWindow(store.position, { store, opts }).position,
    onMove,
    onStart,
  }).isDragging

  // Position on start
  await nextTick()
  updateStore(store.position, { store, opts })

  // Ensure window stays within boundary
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

  size.width = useClamp(draggable.width, ctx.opts.minWidth, root.width - padding * 2)
  size.height = useClamp(draggable.height, ctx.opts.minHeight, root.height - padding * 2)

  pos.x = useClamp(curPos.x, padding, root.width - size.width.value - padding)
  pos.y = useClamp(curPos.y, padding, root.bottom - size.height.value - padding)

  return {
    position: pos,
    size,
  }
}
