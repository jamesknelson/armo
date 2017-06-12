import './Switch.less'
import React, { Component } from 'react'
import cx from 'classnames'
import { createFocusBackend, createFocusManager } from '../src/focus'
import Switch from '../src/controls/Switch'
import Option from '../src/controls/Option'
import createPrefixer from '../src/util/createPrefixer'

const prefix = createPrefixer('examples', 'Switch')


const SwitchView = prefix(function SwitchView({ connect, focused, children }) {
  return connect(
    <div className={cx({ focused })}>
      {children}
    </div>
  )
})

const OptionView = prefix(function OptionView({ connect, focused, active, children }) {
  return connect(
    <div className={cx({ focused, active })}>
      {children}
    </div>
  )
})


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
        <Switch bus={bus} view={SwitchView}>
          <Option value='au' view={OptionView}>Australia</Option>
          <Option value='ja' view={OptionView}>Japan</Option>
        </Switch>

        <Switch bus={bus} view={SwitchView}>
          {this.state.options.map(([value, label], i) =>
            <Option value={value} key={value} view={OptionView}>{label}</Option>
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