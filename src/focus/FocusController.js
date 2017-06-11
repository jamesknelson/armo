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
    }
  }

  constructor(props) {
    super(props)
    this.receiveFocusManager(this.props.bus.focusManager)
    const result = this.focusManager.addControl(this.props.focusableType, this.props.focusIndex, this, this.getItem)
    this.id = result.id
    this.destroyControl = result.destroyControl
    this.state = {
      focused: false,
      childFocusManager: result.childFocusManager,
    }
  }

  controllerWillReceiveProps(nextProps) {

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


    //props.focusManager.
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

    if (this.focusManager) {
      this.destroyFocusManager()
    }
  }

  destroyFocusManager() {
    this.unsubscribe()
    this.focusManager = null
  }

  getItem = () => this.props.value

  handleRef = (node) => {
    if (node === this.node) {
      return
    }

    this.node = node

    // todo: what if the reason we don't have a focus manager is because it would have been missing a node?
    if (!this.focusManager) {
      return
    }

    this.focusManager.setNode(this.id, node)
    this.focusManager.backend.connect(this.id, node)

    if (!this.node) {
      this.destroyFocusManager()
    }
    else {
      // this.focusManager.receiveNode(this.focusableId, node)
    }
  }

  childrenDidReceiveFocus = () => {
    this.setState({ childrenFocused: true })
  }

  childrenDidLoseFocus = () => {
    this.setState({ childrenFocused: false })
  }

  controlDidReceiveFocus = () => {
    this.setState({ focused: true })
  }

  controlDidLoseFocus = () => {
    this.setState({ focused: false })
  }

  output() {
    return {
      connectFocusable: this.connectFocusable,
      focused: this.state.focused,
      childrenFocused: this.state.childrenFocused,

      // TODO: delete this
      id: this.id,

      bus: {
        ...this.props.bus,
        focusManager: this.state.childFocusManager,
      }
    }
  }
}