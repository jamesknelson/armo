// TODO:
// - handle Firefox < 48, where relatedTarget is not available
// - handle IE <= 11, where blur/focus events are async


const isIE = false
const isOldFirefox = false


class FocusBackend {
  constructor(manager) {
    this.manager = manager

    this.nodeIds = new WeakMap
    this.nodes = {}
    this.tabIndexes = {}

    this.timeout = null

    this.handleCaptureFocus = this.handleCaptureFocus.bind(this)
    this.handleTimeout = this.handleTimeout.bind(this)

    this.setup()
  }


  get window() {
    if (typeof window !== 'undefined') {
      return window;
    }
    return undefined;
  }


  setup() {
    if (this.window === undefined) {
      return
    }

    if (this.window.__isFocusBackendSetUp) {
      throw new Error('Cannot have two Focus Manager Backends at the same time.')
    }
    this.window.__isFocusBackendSetUp = true

    // TODO: If IE, we'll need to use focusin
    this.window.addEventListener('focus', this.handleCaptureFocus, true)
  }

  teardown() {
    if (this.window === undefined) {
      return
    }

    this.window.removeEventListener('focus', this.handleCaptureFocus, true)
  }


  connect(id, node) {
    this.nodeIds.set(node, id)
    this.nodes[id] = node

    const handleBlur =
      isIE
        ? e => e.target === node && this.handleBlur(e, id)
        : e => this.handleBlur(e, id)

    const eventName = isIE ? 'focusout' : 'blur'

    node.addEventListener(eventName, handleBlur)

    if (this.tabIndexes[id] !== undefined) {
      node.tabIndex = this.tabIndexes[id]
    }
    if (this.manager.currentId === id) {
      this.focus(id)
    }

    return () => {
      node.removeEventListener(eventName, handleBlur);
      this.nodeIds.delete(node)
      delete this.nodes[id]
      delete this.tabIndexes[id]
    }
  }

  setTabIndex(id, tabIndex) {
    const node = this.nodes[id]
    const oldTabIndex = this.tabIndexes[id]
    this.tabIndexes[id] = tabIndex
    if (node && oldTabIndex !== tabIndex) {
      node.tabIndex = tabIndex
    }
  }

  focus(id) {
    const node = this.nodes[id]
    if (node) {
      this._isFocusing = id
      node.focus()
      this._isFocusing = false
    }
  }

  blur(id) {
    const node = this.nodes[id]
    if (node) {
      this._isBlurring = id
      node.blur()
      this._isBlurring = false
    }
  }

  handleCaptureFocus(e) {
    this.clearTimeout()

    const id = this.nodeIds.get(e.target)
    if (!id) {
      this.manager.blur()
    }
    else if (this._isFocusing !== id) {
      // TODO: pass a bool that indicates whether tab was pressed or not
      this.manager.focus(id)
    }
  }

  handleBlur(e) {
    if (!this._isBlurring) {
      if (!isOldFirefox && !e.relatedTarget) {
        this.manager.blur()
      }
      else {
        this.waitForFocus()
      }
    }
  }

  waitForFocus() {
    this.waitingForFocus = true
    this.timeout = window.setTimeout(this.handleTimeout)
  }
  clearTimeout() {
    if (this.timeout) {
      window.clearTimeout(this.timeout)
    }
    this.timeout = null
    this.waitingForFocus = null
  }
  handleTimeout() {
    this.manager.blur()
    this.clearTimeout()
  }
}


export function createFocusBackend(focusManager) {
  return new FocusBackend(focusManager)
}