import { getGlobal, lodash } from '/bb-vue/lib.js'

export default async function useDraggableWindow(store, options = {}) {
  const { reactive, nextTick } = getGlobal('Vue')
  const { useDraggable, useElementBounding, until, get } = getGlobal('VueUse')

  if (!lodash.isObjectLike(store)) {
    throw new Error('Must provide store as first arg')
  }

  let opts = reactive({
    titleBarRef: null,
    draggableRef: null,
    startPosition: { x: 0, y: 0 },
    startPositionOffset: { x: 0, y: 0 },
    constrainDrag: true,
    constrainPadding: 25,
    ...lodash.omitBy(options, lodash.isNil),
  })

  if (!opts.titleBarRef) {
    throw new Error('Must provide titleBarRef in options')
  }
  if (!opts.draggableRef) {
    throw new Error('Must provide draggableRef in options')
  }

  store.position = {}
  store.fixedRoot = useElementBounding(document.querySelector('[bbv-root]'))
  store.titleBar = useElementBounding(opts.titleBarRef)
  store.draggableTarget = useElementBounding(opts.draggableRef)

  await until(store.draggableTarget).toMatch((x) => x.width > 0, {
    timeout: 50,
    throwOnTimeout: true,
  })

  store.position = {
    x: get(store.fixedRoot.width) / 2 - get(store.draggableTarget.width) / 2,
    y: get(store.fixedRoot.height) / 2 - get(store.draggableTarget.height) / 2,
  }

  if (opts.startPositionOffset) {
    store.position.x += opts.startPositionOffset?.x ?? 0
    store.position.y += opts.startPositionOffset?.y ?? 0
  }

  useDraggable(opts.titleBarRef, {
    initialValue: constrainPosition(store.position, { store, opts }),
    onMove: (p) => updateStore(p, { store, opts }),
  })

  await nextTick()
  updateStore(store.position, { store, opts })
}

function updateStore(position, ctx) {
  if (ctx.opts.constrainDrag) {
    ctx.store.position = constrainPosition(position, ctx)
  }

  ctx.store.style = {
    left: `${ctx.store.position.x}px`,
    top: `${ctx.store.position.y}px`,
    maxWidth: `${ctx.store.fixedRoot.width - ctx.opts.constrainPadding * 2}`,
    maxHeight: `${ctx.store.fixedRoot.height - ctx.opts.constrainPadding * 2}`,
  }
}

function constrainPosition(position, ctx) {
  const { useClamp } = getGlobal('VueUse')

  let toRet = { x: 0, y: 0 }
  let padding = ctx.opts.constrainPadding

  toRet.x = useClamp(
    position.x,
    padding,
    ctx.store.fixedRoot.width - ctx.store.draggableTarget.width - padding
  )

  toRet.y = useClamp(
    position.y,
    padding,
    ctx.store.fixedRoot.bottom - ctx.store.draggableTarget.height - padding
  )

  return toRet
}
