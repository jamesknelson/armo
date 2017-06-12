import React, { Component } from 'react'
import { controlledBy } from '../controllers'
import { FocusController } from '../focus'


class SwitchFocusController extends FocusController {
  controlWillReceiveFocus() {
    this.actions.focusFirstMatch(value => {
      return value === this.props.bus.value
    })
  }
}

@controlledBy(SwitchFocusController)
export default class Switch extends Component {
  connectSwitch = (reactElement) =>
    this.props.connectFocusable(React.cloneElement(reactElement, {
      onKeyDown: this.handleKeyDown
    }))

  render() {
    const props = this.props

    const bus = {
      ...this.props.bus,
      onFocus: this.handleChildFocus,
    }

    const content =
      typeof props.children === 'function'
        ? props.children(bus)
        : React.Children.map(props.children, child => React.cloneElement(child, { bus }))

    return React.createElement(this.props.view, {
      focused: this.props.focused || this.props.childrenFocused,
      connect: this.connectSwitch,
      children: content,
    })
  }

  handleChildFocus = (value) => {
    if (this.props.bus.onChange) {
      this.props.bus.onChange(value)
    }
  }

  handleKeyDown = (event) => {
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        event.preventDefault()
        event.stopPropagation()
        this.props.taxi.focusNext()
        break

      case "ArrowUp":
      case "ArrowLeft":
        event.preventDefault()
        event.stopPropagation()
        this.props.taxi.focusPrevious()
        break

      // TODO:
      // - handle home/end or command+arrow to move to beginning/end
      // - handle search (will need to put label in option items)
    }
  }
}