/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
import * as Sunshine from '../../react'
import * as Password from '../apps/password'

type State = {
  visible: boolean,
}

export default class PasswordComponent extends Sunshine.Component<{},{},State> {
  getState({ requestPassword }: Password.AppState): State {
    return { visible: requestPassword }
  }

  onPassword(event: Event) {
    event.preventDefault()
    const pass = this.refs.passwordInput.value
    this.emit(new Password.ProvidePassword(pass))
  }

  render(): React.Element {
    if (!this.state.visible) { return <span></span> }
    return <form className="passwordForm" onSubmit={this.onPassword.bind(this)}>
      <input type="password" name="password" ref="passwordInput" />
    </form>
  }
}
