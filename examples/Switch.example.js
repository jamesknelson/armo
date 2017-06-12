import './Switch.less'
import React, { Component } from 'react'
import { controlledBy } from '../src/controllers'
import { createFocusBackend, FocusController, createFocusManager } from '../src/focus'
import withDefaultProps from 'util/withDefaultProps'


class SwitchFocusController extends FocusController {
  controlWillReceiveFocus() {
    this.actions.focusFirstMatch(value => {
      return value === this.props.bus.value
    })
  }
}

class OptionFocusController extends FocusController {
  getItem() {
    return this.props.value
  }
}


@controlledBy(SwitchFocusController)
class Switch extends Component {
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

    return this.props.connectFocusable(
      <div onKeyDown={this.handleKeyDown}>
        SWITCH
        {content}
      </div>
    )
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

@controlledBy(OptionFocusController)
class Option extends Component {
  render() {
    const props = this.props

    const style = {}

    if (props.value === props.bus.value) {
      style.backgroundColor = 'blue'
      style.color = 'white'
    }

    return props.connectFocusable(
      <div style={style}>
        {props.children}
      </div>
    )
  }
}


export default class FocusExample extends Component {
  constructor(props) {
    super(props)
    this.focusManager = createFocusManager(createFocusBackend)
    this.nextOption = 1
    this.state = {
      value: 'au',
      options: [
        ['au', 'Australia'],
        ['ja', 'Japan'],
        ['us', 'United States']
      ]
    }
  }

  componentWillUnmount() {
    this.focusManager.destroy()
  }

  render() {
    const bus = {
      focusManager: this.focusManager,
      value: this.state.value,
      onChange: this.handleChange,
    }

    return (
      <div>
        <Switch bus={bus}>
          <Option value='au'>Australia</Option>
          <Option value='ja'>Japan</Option>
        </Switch>
        <Switch bus={bus}>
          {this.state.options.map(([value, label], i) =>
            <Option value={value} key={value}>{label}</Option>
          )}
        </Switch>
        <button onClick={this.addOption}>
          Add option
        </button>
      </div>
    )
  }

  addOption = () => {
    this.setState({
      options: this.state.options.concat([[String(this.nextOption), `Option ${this.nextOption++}`]])
    })
  }

  handleChange = (value) => {
    this.setState({ value })
  }
}