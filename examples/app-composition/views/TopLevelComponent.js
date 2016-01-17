/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
import * as Sunshine from '../../../react'
import { mailState, passState } from '../top-level'
import MailComponent from './MailComponent'
import PasswordComponent from './PasswordComponent'

export default class TopLevelComponent extends Sunshine.Component<{},{},{}> {
  render(): React.Element {
    return <div>
      <div id="messageList">
        <MailComponent focus={mailState} />
      </div>
      <div id="passwordEntry">
        <PasswordComponent focus={passState} />
      </div>
    </div>
  }
}
