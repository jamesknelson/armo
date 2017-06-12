import React, { Component } from 'react'
import { controlledBy } from '../controllers'
import { FocusController } from '../focus'


class OptionFocusController extends FocusController {
  getItem() {
    return this.props.value
  }
}

@controlledBy(OptionFocusController)
export default class Option extends Component {
  connectOption = (reactElement) =>
    this.props.connectFocusable(reactElement)

  render() {
    return React.createElement(this.props.view, {
      focused: this.props.focused || this.props.childrenFocused,
      active: this.props.value === this.props.bus.value,
      connect: this.connectOption,
      children: this.props.children,
    })
  }
}