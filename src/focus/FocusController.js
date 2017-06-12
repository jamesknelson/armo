// Communicates with `bus.focusManager` to keep track of `tabindex` and inject `focused` prop.

// - `focus()` action will focus
// - `connectFocusable()` adds ref to passed in React Element, allowing `focus()` action to work with DOM and to add onFocus/onBlur events
// - doesn't need a separate backend/monitor, just a ref that allows it to be focused manually
// - pass actions to React onBlur and onFocus props, which delegate out to the focusManager
// - outputs `tabindex`, `focused`
// - accepts `onFocus`, `onBlur` callbacks
// - outputs `focus()` action on bus

/*

FocusController
---------------

Handles the following:

- receving ref to create/destory controls on the focusManager
- updating tabindex
- destroying the focusable when `canFocus` becomes falsy, creating it again when it becomes truthy
- connecting onFocus/onBlur events to the focusManager
- actually performing a focus if necessary (i.e. onFocus, when childCount == 0 and the node isn't already focused)
- disconnecting/connecting to a new focusManager (which may be created if the parent's type changes for some reason)

Truths:

- To have a `childFocusManager` and `destroy` we need: a node, a focusManager, a type. Need canFocus() to be true.
- Change of only `node` will not cause any change to `childFocusableManager`.
- Change to focusManager or type will casue `childFocusableManager` to change.

 */


import React from 'react'
import PropTypes from 'prop-types'
import Controller from '../controllers/Controller'
import shallowCompare from '../util/shallowCompare'


export default class FocusController extends Controller {
  static propTypes = {
    bus: PropTypes.shape({
      focusManager: PropTypes.object,

      // The value will be passed to any onFocus/onBlur handlers
      value: PropTypes.any,

      // By default, a control is only focusable if it is not disabled
      disabled: PropTypes.bool,
    }),

    // If you don't want to pass this in via props, you can override getFocusableType()
    focusableType: PropTypes.oneOf(['group', 'focusable', 'modal']),

    focusIndex: PropTypes.number,
  }

  static defaultProps = {
    focusableType: 'focusable',
    focusIndex: 0,
  }

  static actions = {
    focus() {
      if (this.focusManager) {
        this.focusManager.focus(this.focusableId)
      }
    },

    focusFirstMatch(predicate) {
      const childFocusManager = this.state.childFocusManager
      if (childFocusManager) {
        for (let id of childFocusManager.getIds()) {
          if (predicate(childFocusManager.getItem(id))) {
            return childFocusManager.focus(id)
          }
        }
      }
    },

    focusPrevious() {
      const childFocusManager = this.state.childFocusManager
      if (childFocusManager) {
        const currentId = childFocusManager.getCurrentId()
        const ids = childFocusManager.getIds()
        if (currentId) {
          const index = ids.indexOf(currentId)
          if (index !== 0) {
            childFocusManager.focus(ids[index - 1])
            return true
          }
        }
        else if (ids.length) {
          childFocusManager.focus(ids[ids.length - 1])
        }
      }
      return false
    },

    focusNext() {
      const childFocusManager = this.state.childFocusManager
      if (childFocusManager) {
        const currentId = childFocusManager.getCurrentId()
        const ids = childFocusManager.getIds()
        if (currentId) {
          const index = ids.indexOf(currentId)
          const nextId = ids[index + 1]
          if (nextId) {
            childFocusManager.focus(nextId)
            return true
          }
        }
        else if (ids.length) {
          childFocusManager.focus(ids[0])
        }
      }
      return false
    }
  }

  constructor(props) {
    super(props)
    this.receiveFocusManager(this.props.bus.focusManager)
    this.getItem = this.getItem.bind(this)
    const result = this.focusManager.addControl(this.props.focusableType, this.props.focusIndex, this)
    this.id = result.id
    this.destroyControl = result.destroyControl
    this.state = {
      focused: false,
      childFocusManager: result.childFocusManager,
    }
  }

  controllerWillReceiveProps(nextProps) {
    if (this.props.focusIndex !== nextProps.focusIndex) {
      this.focusManager.setControlIndex(this.id, nextProps.focusIndex)
    }
  }

  /**
   * Override this in a subclass to change whether this control and its
   * children can currently be focused.
   */
  canFocus() {
    return !this.props.bus.disabled
    // TODO: when canFocus is falsy, remove the focusManager and hardwire tabindex to -1,
    // and set a dummy focusManager for children so that they'll be dsiabled too.
  }

  getFocusableType() {
    return this.props.focusableType
  }

  linkToFocusManager() {
    this.focusManager(type, index, lifecycle, node, getItem)
  }

  connectFocusable = (el) => {
    return React.cloneElement(el, {
      ref: this.handleRef,
    })
  }

  receiveFocusManager(focusManager) {
    if (focusManager === this.focusManager) {
      return
    }

    this.focusManager = focusManager

    if (!this.node) {
      return
    }
  }

  handleRef = (node) => {
    if (node === this.node) {
      return
    }

    this.node = node

    // todo: what if the reason we don't have a focus manager is because it would have been missing a node?
    if (!this.focusManager) {
      return
    }

    if (!this.node) {
      this.destroyControl()
    }
    else {
      this.focusManager.backend.connect(this.id, node)
    }
  }

  getItem() {
    return this.props.bus.value
  }

  controlWillReceiveFocus() {
    this.setState({ receiving: true })
  }
  controlWillLoseFocus() {
    this.setState({ receiving: true })
  }

  childrenWillReceiveFocus() {
    this.setState({ receiving: true })
  }
  childrenWillLoseFocus() {
    this.setState({ receiving: true })
  }

  childrenDidReceiveFocus() {
    this.setState({ childrenFocused: true, receiving: false })
  }
  childrenDidLoseFocus() {
    this.setState({ childrenFocused: false, receiving: false })
  }

  controlDidReceiveFocus() {
    if (this.props.bus.onFocus) {
      this.props.bus.onFocus(this.getItem())
    }

    this.setState({ focused: true, receiving: false })
  }
  controlDidLoseFocus() {
    this.setState({ focused: false, receiving: false })
  }

  shouldCalculateOutput(previousProps, previousState) {
    // Do not change output when we expect another output, or when nothing has changed.
    return !this.state.receiving && (!shallowCompare(this.props, previousProps) || !shallowCompare(this.state, previousState))
  }

  output() {
    return {
      connectFocusable: this.connectFocusable,
      focused: this.state.focused,
      childrenFocused: this.state.childrenFocused,

      // A Taxi is a private bus, that should not be passed along to other controls
      taxi: {
        ...this.actions,
      },

      bus: {
        ...this.props.bus,
        focusManager: this.state.childFocusManager,
      }
    }
  }
}