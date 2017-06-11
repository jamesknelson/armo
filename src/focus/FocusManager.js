import getNextUniqueId from '../util/getNextUniqueId'


function compareSiblingControls(left, right) {
  if (left.index === right.index || left.index === 0 || right.index === 0) {
    return Math.sign(right.id - left.id)
  }
  return Math.sign(right.index - left.index)
}


class FocusManager {
  constructor(createBackend) {
    this.backend = createBackend(this)

    this.runningControlWillReceiveFocus = false
    this.runningFocusLifecycle = false
    this.controls = {}
    this.currentModalId = undefined
    this.currentId = undefined
    this.relatedIds = {}
  }

  destroy() {
    console.log('TODO: destroyabole focus manager')
  }

  addControl(id, path, type, index, lifecycle) {
    const parent = this.controls[path[path.length-1]]

    let top, modalId
    for (let i = path.length-1; i >= 0; i--) {
      const ancestor = this.controls[path[i]]
      if (ancestor.type === 'modal') {
        modalId = ancestor.id
        top = this.controls[path[i+1]]
        break
      }
    }
    if (!modalId) {
      top = this.controls[path[0]]
    }

    const control = {
      id,
      type,
      modalId,
      top,
      path,
      parent,
      index: index || 0,
      lifecycle,
      latest: [],
      children: [],
    }

    this.controls[id] = control

    if (type === 'modal') {
      // Modals do not have tabindexes and are not stored in their parent's
      // `children` list, so we're done.
      return
    }

    if (top && top.modalId === this.currentModalId) {
      // If we're adding the first focusable descendent to a top-level group,
      // we'll also need to give the group a tabIndex.
      if (top.type === 'group' && !this.getFirstFocusableChild(top)) {
        this.setTabIndex(top.id)
      }

      // If we're adding the first focusable descendent to a non-top group,
      // we'll need to make it clickable by giving it a -1 tabIndex.
      for (let id of path.slice(path.indexOf(top.id) + 1)) {
        const control = this.controls[id]
        if (control.type === 'group' && !this.getFirstFocusableChild(control)) {
          this.setTabIndex(control.id, null)
        }
      }
    }

    // Add this control to the parent's list of children
    if (parent) {
      const index = this.findIndex(parent.children, control)
      parent.children.splice(index, 0, id)
    }

    if (!parent || parent.type === 'modal') {
      // If we're a top control, set up a list to track which inner controls
      // may get a tab index
      control.top = control
      control.tabFocusableDescendents = []
    }
    else if (type === 'focusable' && parent.type === 'group') {
      const x = top.tabFocusableDescendents
      const len = x.length
      for (let i = 0; i < len; i++) {
        if (this.isLeftOrderedBeforeRight(control, this.controls[x[i]])) {
          x.splice(i, 0, id)
          break
        }
      }
      if (x.length === len) {
        x.push(id)
      }
    }

    if (type !== 'focusable') {
      // Groups without children cannot have tab indexes, so we're done
      return
    }

    // If our direct parent is the active modal, we need a tabIndex with no
    // offset
    if (!parent ? !this.currentModalId : (parent.id === this.currentModalId)) {
      this.setTabIndex(id)
    }
    // If we share top with the currently active control then its next/previous
    // ids may change (as we may be inserted between them and the active
    // control)
    else if (!this.runningFocusLifecycle && this.controls[this.currentId] && this.controls[this.currentId].top === top) {
      const oldRelated = this.relatedIds
      this.calculateRelated()
      if (this.relatedIds.nextId === id) {
        this.setTabIndex(id, 1)
        if (oldRelated.nextId) {
          this.setTabIndex(oldRelated.nextId, null)
        }
      }
      else if (this.relatedIds.previousId === id) {
        this.setTabIndex(id, -1)
        if (oldRelated.previousId) {
          this.setTabIndex(oldRelated.previousId, null)
        }
      }
    }

    if (control.tabIndex === undefined) {
      this.setTabIndex(id, null)
    }
  }

  setNode(id, node) {
    const control = this.controls[id]
    if (control) {
      control.node = node
      if (control.tabIndex !== undefined) {
        control.node.tabIndex = control.tabIndex
      }
      if (id === this.currentId) {
        node.focus()
      }
    }
  }

  destroyControl(id) {
    const { parent, path, type, top } = this.controls[id]

    if (children.length) {
      throw new Error('FocusManager: You cannot destroy a control while it still has child controls.')
    }

    delete this.controls[id]

    if (type === 'modal') {
      // Modals do not have tabindexes and are not stored in their parent's
      // `children` array, so we're done
      return
    }

    const isCurrent = this.currentId === id
    const parentIndex = parent && parent.children.indexOf(id)

    // Remove this control from its parent's `children`
    if (parent) {
      parent.children.splice(parent.children.indexOf(id), 1)
    }
    if (top.id !== id) {
      top.tabFocusableDescendents.splice(top.tabFocusableDescendents.indexOf(id), 1)
    }

    if (type === 'group') {
      // Groups without children cannot have tabindexes and cannot be set as
      // current, so we're done
      return
    }
    if (isCurrent) {
      this.currentId = null
    }

    // If this is the last focusable control of a top group in the current
    // modal, remove its tabIndex
    if (top.type === 'group' && top.modalId === this.currentModalId && !this.getFirstFocusableChild(top)) {
      this.setTabIndex(top, false)
    }

    // If we're running focus lifecycle, then a `focus()` call is already
    // scheduled, so we can return instead of focusing another item or
    // updating tabindexes.
    if (this.runningFocusLifecycle) {
      return
    }

    // If we're adjacent to the current control, we'll need to recalculate
    // relatedIds and notify the new adjacent control of its new tabindex
    const oldRelated = this.relatedIds
    if (oldRelated.nextId === id) {
      this.calculateRelated()
      const nextId = this.relatedIds.nextId
      if (nextId) {
        this.setTabIndex(nextId, 1)
      }
    }
    else if (oldRelated.previousId === id) {
      this.calculateRelated()
      const previousId = this.relatedIds.previousId
      if (previousId) {
        this.setTabIndex(previousId, -1)
      }
    }

    if (!isCurrent) {
      // If this control was not focused, we don't need to transfer focus
      // anywhere else, so we're done
      return
    }

    // Transfer focus somewhere else if possible
    if (parent) {
      const nextSiblingId = parent.children.slice(parentIndex).find(id => this.controls[id].type === 'focusable')
      const previousSiblingId = parent.children.slice(0, parentIndex).find(id => this.controls[id].type === 'focusable')

      // Try adjacent focusable siblings first
      if (nextSiblingId) {
        this.focus(nextSiblingId)
      }
      else if (previousSiblingId) {
        this.focus(previousSiblingId)
      }

      // Failing that, try adjacent grouped controls (from before recalc)
      else if (oldRelated.nextId) {
        this.focus(oldRelated.nextId)
      }
      else if (oldRelated.previousId) {
        this.focus(oldRelated.previousId)
      }

      // If there are no adjacent controls, try ancestors
      else {
        for (let i = path.length-1; i >= 0; i--) {
          const control = this.controls[path[i]]

          if (control.type === 'modal') {
            // If the nearest available ancestor is a modal, we need to focus
            // something from within that modal to ensure focus stays within
            // the modal.
            const firstFocusableChild = this.getFirstFocusableChild(control)
            if (firstFocusableChild) {
              this.focus(firstFocusableChild.id)
              return
            }
          }
          else if (control.type === 'focusable') {
            // If the nearest available ancestor is a focusable, we can
            // transfer focus to it
            this.focus(control.id)
            return
          }
        }

        this.blur()
      }
    }
    else {
      // If we can't find anything to focus, call blur to ensure that we don't
      // have any dangling tabindex/focus state
      this.blur()
    }
  }

  setControlIndex(id, index) {
    const control = this.controls[id]

    if (control.type === 'modal' || index === control.index) {
      return
    }

    control.index = index

    let existingOrder, newOrder
    const parent = control.parent || {}
    const currentControl = this.controls[this.currentId]
    if (parent.id) {
      // Move this control within its parent's `children` array
      const parentChildren = parent.children
      const existingOrder = parentChildren.indexOf(id)
      parentChildren.splice(existingOrder, 1)
      const newOrder = this.findIndex(parentChildren, control)
      parentChildren.splice(newOrder, 0, id)
    }

    if (!parent.id ? this.currentModalId : (control.modalId !== this.currentModalId)) {
      // If we're part of a non-active modal then no tab indexes can change
      return
    }

    if (parent.id && parent.id !== this.currentModalId && newOrder === existingOrder) {
      // If we're not a direct child of the currently active modal and our
      // order within the parent doesn't change, we're done
      return
    }

    if (!currentControl ? !control.modalId : (this.currentModalId === parent.id && currentControl.top !== control)) {
      // If we're at the top of the current modal but not the top of the
      // currently active control, just set our own tabIndex
      this.setTabIndex(id)
      return
    }

    if (currentControl && currentControl.top !== control.top) {
      // If this control does not share its top with the currently
      // focused control, then no tabIndexes can change.
      return
    }

    if (this.runningFocusLifecycle) {
      // If we're a nested control and this method is called from within a
      // lifecycle method, then any tabindex changes will be performed by
      // the focus() method, so we're done.
      return
    }

    // This control is either the top of the currently focused control, or it
    // shares its top with the currently focused control, so the related ids
    // may change.
    const oldRelated = this.relatedIds
    this.calculateRelated()
    const tabIndexChanges = {}
    if (oldRelated.nextId !== this.relatedIds.nextId) {
      tabIndexChanges[oldRelated.nextId] = null
    }
    if (oldRelated.previousId !== this.relatedIds.previousId) {
      tabIndexChanges[oldRelated.previousId] = null
    }
    tabIndexChanges[this.relatedIds.nextId] = 1
    tabIndexChanges[this.relatedIds.previousId] = -1
    this.changeTabIndexes(tabIndexChanges)
  }

  focus(id, direct=false) {
    if (this.focusingNode) {
      return
    }

    // If we're not specifically focusing this id, see if it has a previously
    // focused child that still exists that we can focus instead.
    // Note: we don't do this for groups, as the best child to focus depends
    // on the direction from which we approach the group.
    if (!direct && this.controls[id].type === 'focusable') {
      const latest = this.controls[id].latest
      for (let i = latest.length - 1; i >= 0; i--) {
        const control = this.controls[latest[i]]
        if (control && control.type === 'focusable') {
          id = latest[i]
          break
        }
      }
    }

    let oldControl
    if (this.currentId) {
      if (this.currentId === id) {
        return
      }
      oldControl = this.controls[this.currentId]
    }

    const control = this.controls[id]
    const { type, node, path, lifecycle } = this.controls[id]

    if (type === 'modal') {
      throw new Error(`FocusManager: You cannot focus a control with type 'modal'. Instead focus a 'focusable' child of your 'modal' control.`)
    }

    let firstFocusableChild
    if (type === 'group') {
      firstFocusableChild = this.getFirstFocusableChild(control)
      if (!firstFocusableChild) {
        throw new Error(`FocusManager: You cannot focus a control with type 'group' unless it has focusable children, as focus is transferred directly to a child.`)
      }
    }

    // Find the parts of the path that have changed and stayed the same
    const pathLosingFocus = []
    let commonIndex
    if (oldControl) {
      const oldPath = oldControl.path
      for (let i = oldPath.length - 1; i >= 0; i--) {
        const id = oldPath[i]
        const newIndex = path.indexOf(id)
        if (newIndex !== -1) {
          commonIndex = newIndex
          break
        }
        pathLosingFocus.push(id)
      }
      pathLosingFocus.reverse()
    }
    const pathReceivingFocus =
      commonIndex === undefined
        ? path.slice(0).reverse()
        : path.slice(commonIndex + 1).reverse()
    const pathKeepingFocus =
      commonIndex === undefined
        ? []
        : path.slice(0, commonIndex + 1).reverse()

    // Keep track of whether this `focus()` call has been nested within another
    // one from a controlWillReceiveFocus handler.
    let isNestedFocus = false

    if (this.runningControlWillReceiveFocus !== false) {
      // runningControlWillReceiveFocus will hold the `id` of any other
      // `focus()` call that we haven't yet completet.
      isNestedFocus = true
      const currentlyFocusingId = this.runningControlWillReceiveFocus

      if (path.indexOf(currentlyFocusingId) === -1) {
        throw new Error("FocusManager: You may only focus a child within 'controlWillReceiveFocus'.")
      }
    }
    else if (this.runningFocusLifecycle) {
      throw new Error("FocusManager: You may not call 'focus' within a lifecycle method other than 'controlWillReceiveFocus'.")
    }
    else {
      this.runningFocusLifecycle = true

      // Call lifecycles on old control and path
      if (oldControl) {
        const cwlfLifecycle = oldControl.lifecycle.controlWillLoseFocus
        if (cwlfLifecycle) {
          cwlfLifecycle()
        }

        // Work backwords from closest to old control, to closest to root
        for (let id of pathLosingFocus) {
          const cwlfLifecycle = this.controls[id].lifecycle.childrenWillLoseFocus
          if (cwlfLifecycle) {
            cwlfLifecycle()
          }
        }
      }
    }

    // Store the current id for access by any calls to `focus()` which are
    // made within the `controllWillReceiveFocus()` lifecycle
    this.runningControlWillReceiveFocus = id

    if (lifecycle.controlWillReceiveFocus) {
      lifecycle.controlWillReceiveFocus()
    }

    // If we're focusing a group and have reached this point without something
    // else being manually focused, then we should focus its first or last
    // available child (depending on the direction we came from).
    if (type === 'group') {
      // TODO: if oldControl doesn't exist or oldControl has a different modalId, use latest control instead of first/last
      if (!oldControl || this.isLeftOrderedBeforeRight(oldControl, control)) {
        this.focus(firstFocusableChild.id)
      }
      else {
        this.focus(this.getLastFocusableChild(control).id)
      }
    }

    // If `runningControlWillReceiveFocus` has changed, then we've already
    // completed another `focus()` from within `controlWillReceiveFocus()`.
    if (this.runningControlWillReceiveFocus !== id) {
      this.runningControlWillReceiveFocus = false
      return
    }

    // If we're nested within another `focus()` call, don't unset
    // `runningControlWillReceiveFocus`, as we need it for the check directly
    // above this one.
    if (!isNestedFocus) {
      this.runningControlWillReceiveFocus = false
    }

    for (let id of pathReceivingFocus) {
      const cwrfLifecycle = this.controls[id].lifecycle.childrenWillReceiveFocus
      if (cwrfLifecycle) {
        cwrfLifecycle()
      }
    }

    const tabIndexChanges = {}

    // Remove tabIndexes from any controls in a blurred modal
    let didModalBlur
    for (let blurId of pathLosingFocus) {
      if (this.controls[blurId].type === 'modal') {
        Object.assign(tabIndexChanges, this.getModalOffsets(blurId, null))
        didModalBlur = true
        break
      }
    }

    // Add tabIndexes to any controls in a newly focused modal
    let didModalFocus
    for (let focusId of pathReceivingFocus) {
      if (this.controls[focusId].type === 'modal') {
        Object.assign(tabIndexChanges, this.getModalOffsets(focusId))
        this.currentModalId = focusId
        didModalFocus = true
        break
      }
    }

    // If we've focused a modal and didn't find another modal to blur, we'll
    // need to remove tabIndexes from the existing modal
    if (didModalFocus && !didModalBlur) {
      const topModalId = pathKeepingFocus.find(id => this.controls[id].type === 'modal')
      Object.assign(tabIndexChanges, this.getModalOffsets(topModalId, null))
    }

    // If we've blurred a modal without focusing a new one, find the topmost
    // active modal and add tabIndexes to its fields.
    if (didModalBlur && !didModalFocus) {
      const topModalId = pathKeepingFocus.find(id => this.controls[id].type === 'modal')
      this.currentModalId = topModalId
      Object.assign(tabIndexChanges, this.getModalOffsets(topModalId))
    }

    // The order here is important - if the same id appears multiple times in
    // this list, the last offset will win. Note that top id can be identical
    // to previous or control ids.
    tabIndexChanges[this.relatedIds.previousId] = null
    tabIndexChanges[this.relatedIds.nextId] = null
    if (oldControl) {
      tabIndexChanges[oldControl.id] = null
      tabIndexChanges[oldControl.top.id] = oldControl.modalId === control.modalId ? 0 : null
    }

    this.currentId = id
    this.calculateRelated()
    tabIndexChanges[control.top.id] = null
    tabIndexChanges[this.relatedIds.previousId] = -1
    tabIndexChanges[this.relatedIds.nextId] = 1
    tabIndexChanges[control.id] = 0
    this.changeTabIndexes(tabIndexChanges)

    if (node) {
      this.focusingNode = true
      node.focus()
      this.focusingNode = false
    }

    for (let i = 0; i < path.length; i++) {
      this.controls[path[i]].latest = path.slice(i+1).concat(id)
    }

    // Call "DidLose" lifecycles on old control and path
    if (oldControl) {
      for (let id of pathLosingFocus.reverse()) {
        // Need to check if the control still exists, as it may have been
        // destroyed in an earlier lifecycle
        const control = this.controls[id]
        const cdlfLifecycle = control && control.lifecycle.childrenDidLoseFocus
        if (cdlfLifecycle) {
          cdlfLifecycle()
        }
      }

      // Need to check if the control still exists, as it may have been
      // destroyed in an earlier lifecycle
      const cdlfLifecycle = this.controls[oldControl.id] && this.controls[oldControl.id].lifecycle.controlDidLoseFocus
      if (cdlfLifecycle) {
        cdlfLifecycle()
      }
    }

    // Call "DidReceive" lifecycles on new control and path
    for (let id of pathReceivingFocus.reverse()) {
      const cdrfLifecycle = this.controls[id].lifecycle.childrenDidReceiveFocus
      if (cdrfLifecycle) {
        cdrfLifecycle()
      }
    }

    const cdrfLifecycle = control.lifecycle.controlDidReceiveFocus
    if (cdrfLifecycle) {
      cdrfLifecycle()
    }

    this.runningFocusLifecycle = false
  }

  blur() {
    if (!this.currentId) {
      return
    }

    this.runningFocusLifecycle = true

    const control = this.controls[this.currentId]

    // TODO: refactor this lifecycle stuff that is common with `focus()` into a helper
    const cwlfLifecycle = control.lifecycle.controlWillLoseFocus
    if (cwlfLifecycle) {
      cwlfLifecycle()
    }

    // Work backwords from closest to old control, to closest to root
    for (let id of control.path.slice(0).reverse()) {
      const cwlfLifecycle = this.controls[id].lifecycle.childrenWillLoseFocus
      if (cwlfLifecycle) {
        cwlfLifecycle()
      }
    }

    const tabIndexChanges = {}

    if (this.currentModalId) {
      Object.assign(tabIndexChanges, this.getModalOffsets(this.currentModalId, null))
      Object.assign(tabIndexChanges, this.getModalOffsets())
    }
    else {
      tabIndexChanges[this.relatedIds.previousId] = null
      tabIndexChanges[this.relatedIds.nextId] = null
      tabIndexChanges[control.id] = null
      tabIndexChanges[control.top.id] = 0
    }

    this.changeTabIndexes(tabIndexChanges)
    this.currentId = undefined
    this.currentModalId = undefined
    if (control.node) {
      control.node.blur()
    }

    for (let id of control.path) {
      // Need to check if the control still exists, as it may have been
      // destroyed in an earlier lifecycle
      const control = this.controls[id]
      const cdlfLifecycle = control && control.lifecycle.childrenDidLoseFocus
      if (cdlfLifecycle) {
        cdlfLifecycle()
      }
    }

    // Need to check if the control still exists, as it may have been
    // destroyed in an earlier lifecycle
    const oldControl = this.controls[control.id]
    const cdlfLifecycle = oldControl && oldControl.lifecycle.controlDidLoseFocus
    if (cdlfLifecycle) {
      cdlfLifecycle()
    }

    this.runningFocusLifecycle = false
  }

  // ---

  setTabIndex(id, offset=0) {
    const control = this.controls[id]

    if (offset === false) {
      if (control.tabIndex !== undefined) {
        delete control.tabIndex
        if (control.node) {
          control.node.tabIndex = undefined
        }
      }
      return
    }

    if (offset === null) {
      if (control.tabIndex !== -1) {
        control.tabIndex = -1
        if (control.node) {
          control.node.tabIndex = -1
        }
      }
      return
    }

    const topIndex = control.path.length === 0 ? control.index : this.controls[control.path[0]].index
    const tabIndex = topIndex*2 + (topIndex === 0 ? 0 : offset)
    if (tabIndex !== control.tabIndex) {
      control.tabIndex = tabIndex
      if (control.node) {
        control.node.tabIndex = tabIndex
      }
    }
  }

  changeTabIndexes(changes) {
    const ids = Object.keys(changes)
    for (let id of ids) {
      if (id !== 'undefined') {
        this.setTabIndex(id, changes[id])
      }
    }
  }

  isLeftOrderedBeforeRight(left, right) {
    if (left.modalId !== right.modalId) {
      throw new Error('FocusManager#isLeftOrderedBeforeRight expects both controls to share a modalId')
    }

    // If tops don't match, we can just use their indexes
    if (left.top !== right.top) {
      return compareSiblingControls(left.top, right.top) === 1
    }

    // Otheriwse find the first non-matching parent and compare its indexes
    const start = left.modalId ? (left.path.indexOf(left.modalId) + 2) : 1
    const end = Math.min(left.path.length, right.path.length)
    for (let i = start; i <= end; i++) {
      const leftId = left.path[i] || left.id
      const rightId = right.path[i] || right.id

      if (leftId !== rightId) {
        return compareSiblingControls(this.controls[leftId], this.controls[rightId]) === 1
      }
    }

    // If all matching ids match, then whichever has the shorter path is left
    return left.path.length < right.path.length
  }

  getFirstFocusableChild(control) {
    for (let childId of control.children) {
      const child = this.controls[childId]
      if (child.type === 'focusable') {
        return child
      }
      else if (child.type === 'group') {
        const first = this.getFirstFocusableChild(child)
        if (first) {
          return first
        }
      }
    }
  }

  getLastFocusableChild(control) {
    // TODO: can this be refactored to share code with getFirstFocusableChild?
    for (let childId of control.children.slice(0).reverse()) {
      const child = this.controls[childId]
      if (child.type === 'focusable') {
        return child
      }
      else if (child.type === 'group') {
        const last = this.getLastFocusableChild(child)
        if (last) {
          return last
        }
      }
    }
  }

  // Find the index within `children` at which to insert `control`
  findIndex(children, control) {
    for (let i = 0; i < children.length; i++) {
      if (compareSiblingControls(children[i], control) === -1) {
        return i
      }
    }
    return children.length
  }

  calculateRelated() {
    const control = this.controls[this.currentId]
    if (control.top === control) {
      this.relatedIds = {
        nextId: control.tabFocusableDescendents[0],
      }
    }
    else {
      const x = control.top.tabFocusableDescendents

      if (x.length === 0) {
        this.relatedIds = {}
      }
      else if (control.parent.type === 'group') {
        const i = x.indexOf(control.id)
        this.relatedIds = {
          previousId: x[i-1],
          nextId: x[i+1],
        }
      }
      else if (this.isLeftOrderedBeforeRight(control, this.controls[x[0]])) {
        this.relatedIds = {
          nextId: x[0],
        }
      }
      else {
        const ancestorIds = []
        let parent = control.parent
        while (parent && parent.type === 'focusable') {
          ancestorIds.push(parent.id)
          parent = parent.parent
        }

        let left
        for (let id of x.filter(id => ancestorIds.indexOf(id) === -1)) {
          const testControl = this.controls[id]
          if (this.isLeftOrderedBeforeRight(control, testControl)) {
            this.relatedIds = {
              previousId: left,
              nextId: id
            }
            return
          }
          left = id
        }
        this.relatedIds = {
          previousId: left,
        }
      }
    }
  }

  getModalOffsets(modalId, forceTo) {
    const tabIndexes = {}
    const children = modalId ? this.controls[modalId].children : Object.keys(this.controls).filter(id => !this.controls[id].parent)

    for (let childId of children) {
      const childControl = this.controls[childId]
      if (childControl.type !== 'modal') {
        tabIndexes[childId] = forceTo === undefined ? 0 : null
      }
    }

    return tabIndexes
  }
}


class FocusManagerInterface {
  constructor(focusManager, path) {
    this.focusManager = focusManager
    this.path = path
    this.childIds = []
    this.getItems = {}
  }

  destroy() {
    if (this.path.length === 0) {
      this.focusManager.destroy()
    }

    this.focusManager = null
    this.getItems = null
  }

  get backend() {
    return this.focusManager.backend
  }

  /**
   * Create a new focusable with the given type, and optionally with the given
   * tab index.
   *
   * - getItem is a function that should return a plain JavaScript object that
   *   can represent the control to parent controls.
   */
  addControl(type, index, lifecycle, getItem) {
    const id = getNextUniqueId()
    const childFocusManager = new FocusManagerInterface(this.focusManager, this.path.concat(id))

    this.focusManager.addControl(id, this.path, type, index, lifecycle)
    this.childIds.push(id)
    this.getItems[id] = getItem

    return {
      id,
      childFocusManager,
      destroyControl: this.destroy.bind(this, id),
    }
  }

  destroyControl(id) {
    const index = this.childIds.indexOf(id)
    if (index !== -1) {
      this.childIds.splice(index, 1)
      this.focusManager.destroyControl(id)
      delete this.getItems[id]
    }
  }

  getChildItem(id) {
    this.getItems[id]()
  }

  /**
   * Return a list of all child ids for a control added via this interface,
   * ordered by control index.
   *
   * This can be used to implement `focusFirstMatchingChild(predicate)` or
   * `seekFocus(n)` within the controller whn used with `getChildItem(id)`.
   */
  getChildIds() {
    // TODO: return this in order of the child's control index
    return this.childIds
  }

  setNode(id, node) {
    this.focusManager.setNode(id, node)
  }

  /**
   * Update the index of a given control. This will be used as a tabindex if
   * the element can receive a tabindex, or otherwise will be used to define
   * movement order for `seekFocus()`.
   */
  setControlIndex(id, index) {
    this.focusManager.setControlIndex(id, index)
  }

  /**
   * Programatically focus a control added via this interface's `addControl`.
   * Note that this does not perform that actual focusing -- it only updates
   * the attributes. The controller will still need to call `node.focus()`
   */
  focus(id, direct) {
    this.focusManager.focus(id, direct)
  }
}


export function createFocusManager(createBackend) {
  return new FocusManagerInterface(new FocusManager(createBackend), [])
}