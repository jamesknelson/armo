import React, { Component } from 'react'
import { controlledBy } from '../src/controllers'
import { createFocusBackend, FocusController, createFocusManager } from '../src/focus'
import withDefaultProps from 'util/withDefaultProps'


@controlledBy(FocusController)
class Control extends Component {
  render() {
    const style = {
      outline: 'none',
      backgroundColor: '#f8f8f8',
      border: '1px solid #aaa',
      borderRadius: '3px',
      width: '100px',
      margin: '5px',
      padding: '5px 10px',
    }

    if (this.props.focused) {
      style.boxShadow = '0px 0px 3px #9ecaed'
      style.border = '1px solid #9ecaed'
    }

    return this.props.connectFocusable(
      <div style={style}>
        {this.props.label} - {this.props.id}
      </div>
    )
  }
}

@controlledBy(FocusController)
class Switch extends Component {
  render() {
    const props = this.props
    const style = {
      outline: 'none',
      backgroundColor: '#f8f8f8',
      border: '1px dashed #aaa',
      borderRadius: '3px',
      width: '100px',
      margin: '5px',
      padding: '5px 10px',
    }

    if (this.props.focused || this.props.childrenFocused) {
      style.boxShadow = '0px 0px 3px #9ecaed'
      style.border = '1px dashed #9ecaed'
    }

    const content =
      typeof props.children === 'function'
        ? props.children({ bus: this.props.bus })
        : React.Children.map(props.children, child => React.cloneElement(child, { bus: this.props.bus }))

    return this.props.connectFocusable(
      <div style={style}>
        SWITCH - {this.props.id}
        {content}
      </div>
    )
  }
}

@controlledBy(FocusController)
class Group extends Component {
  render() {
    const props = this.props
    const style = {
      outline: 'none',
      backgroundColor: '#f8f8f8',
      border: '1px solid #aaa',
      borderRadius: '3px',
      width: '100px',
      margin: '5px',
      padding: '5px 10px',
    }

    if (this.props.childrenFocused) {
      style.boxShadow = '0px 0px 3px #9ecaed'
      style.border = '1px dotted #9ecaed'
    }

    const content =
      typeof props.children === 'function'
        ? props.children({ bus: this.props.bus })
        : React.Children.map(props.children, child => React.cloneElement(child, { bus: this.props.bus }))

    return props.connectFocusable(
      <div style={style}>
        GROUP - {this.props.id}
        {content}
      </div>
    )
  }
}

@controlledBy(FocusController)
class Modal extends Component {
  render() {
    const props = this.props
    const style = {
      outline: 'none',
      backgroundColor: '#f8f8f8',
      border: '1px solid #aaa',
      borderRadius: '3px',
      width: '100px',
      margin: '5px',
      padding: '5px 10px',
      position: 'absolute',
      left: '200px',
    }

    return props.connectFocusable(
      <div style={style}>
        MODAL - {this.props.id}
        {props.children(this.props.bus)}
      </div>
    )
  }
}


export default class FocusExample extends Component {
  constructor(props) {
    super(props)

    this.focusManager = createFocusManager(createFocusBackend)
  }

  componentWillUnmount() {
    this.focusManager.destroy()
  }

  render() {
    const bus = {
      focusManager: this.focusManager,
      value: 'Test',
    }

    return (
      <div>
        <Control bus={bus} label='A' />
        <Switch bus={bus}>
          <Control label='Option 1' />
          <Control label='Option 2' />
        </Switch>
        <Control bus={bus} label='B' />
        <Group bus={bus} focusableType='group'>
          <Control label='C.1' />
          {<Switch bus={bus}>
            <Control label='Option 1' />
            <Control label='Option 2' />
          </Switch>}
          <Control label='C.2' />
          <Modal bus={bus} focusableType='modal'>
          {bus =>
            <div>
              <Control bus={bus} label='M.1' />
              <Group bus={bus} focusableType='group'>
                <Control label='M.2.i' />
                <Control label='M.2.ii' />
                <Switch bus={bus}>
                  <Control label='Option 1' />
                  <Control label='Option 2' />
                </Switch>
              </Group>
              <Control bus={bus} label='M.3' />
              <Control bus={bus} label='M.4' />
            </div>
          }
          </Modal>
          <Group bus={bus} focusableType='group'>
            <Control label='C.3.i' />
            <Group bus={bus} focusableType='group' />
            <Group bus={bus} focusableType='group'>
              <Control label='C.3.ii' />
            </Group>
            <Control label='C.3.iii' />
          </Group>
          <Control label='C.4' />
        </Group>
        <Control bus={bus} label='D' />
        <Control bus={bus} label='E' />
      </div>
    )
  }
}