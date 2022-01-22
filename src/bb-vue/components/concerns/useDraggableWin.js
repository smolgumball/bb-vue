// prettier-ignore
import { doc, lodash, Vue, VueUse, win } from '/bb-vue/lib.js'

export default async function useDraggableWin(store, options = {}) {
  const { reactive, watch } = Vue()
  const { useDraggable, useElementBounding, until } = VueUse()

  // Handle options + validations
  let opts = reactive({
    win: null,
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
  if (!lodash.isObjectLike(opts.win)) {
    throw new Error('Must provide win in options')
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
  store.isDragging = false
  store.style = {}
  store.fixedRoot = useElementBounding(doc.querySelector('[bbv-root]'))
  store.draggableTarget = useElementBounding(opts.draggableRef)

  // Helper to manually position draggable
  const manuallyPositionDraggable = async ({ x, y }) => {
    const ele = opts.draggableRef
    ele.style.left = `${x}px`
    ele.style.top = `${y}px`
    store.draggableTarget.update()
    updateStore({ store, opts })
  }
  const manuallySizeDraggable = async ({ width, height }) => {
    const ele = opts.draggableRef
    ele.style.width = `${width}px`
    ele.style.height = `${height}px`
    store.draggableTarget.update()
    updateStore({ store, opts })
  }

  // Wait until draggableTarget is mounted, might be a better way?
  await until(store.draggableTarget).toMatch((x) => x.width > 0)

  // Sync minWidth / minHeight from CSS styles applied to window
  store.minWidth = parseInt(win.getComputedStyle(opts.draggableRef).minWidth)
  store.minHeight = parseInt(win.getComputedStyle(opts.draggableRef).minHeight)

  // Set initial position - if none is provided - based on winManager recommendation
  let initialPos = { x: 0, y: 0 }
  if (opts.startPosition === null) {
    initialPos = opts.winManager.getRecommendedPosition(opts.win)
  } else {
    initialPos = { x: opts.startPosition?.x ?? 0, y: opts.startPosition?.y ?? 0 }
  }

  // Do initial positioning of window
  manuallyPositionDraggable(initialPos)

  // Watch for position changes
  store.isDragging = useDraggable(opts.dragHandleRef, {
    initialValue: initialPos,
    onMove: async (p) => manuallyPositionDraggable(p),
    onStart: (_, e) => !e.path.some((x) => x == opts.dragIgnoreRef),
  }).isDragging

  // Watch for size changes
  watch(store.draggableTarget, () => manuallySizeDraggable(store.draggableTarget), { deep: true })
}

async function updateStore(ctx) {
  const { reactive } = Vue()

  let padding = ctx.opts.constrainPadding
  let root = ctx.store.fixedRoot
  let draggable = ctx.store.draggableTarget

  let newSize = reactive({ width: draggable.width, height: draggable.height })
  let newPos = reactive({ x: draggable.x, y: draggable.y })

  // Clamp window size and position if desired
  if (ctx.opts.constrain) {
    const { useClamp } = VueUse()

    newSize.width = useClamp(newSize.width, ctx.store.minWidth, root.width - padding * 2)
    newSize.height = useClamp(
      newSize.height,
      ctx.store.isCollapsed ? 0 : ctx.store.minHeight,
      root.height - padding * 2
    )

    newPos.x = useClamp(newPos.x, padding, root.width - newSize.width - padding)
    newPos.y = useClamp(newPos.y, padding, root.bottom - newSize.height - padding)
  }

  // Update style object to be bound to draggableTarget in consumer template
  ctx.store.style = {
    left: `${newPos.x}px`,
    top: `${newPos.y}px`,
    width: `${newSize.width}px`,
    height: `${newSize.height}px`,
  }
}
