/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
import * as Sunshine from '../../react'
import * as Mail from '../apps/mail'

import type { AppState, Message } from '../apps/mail'

type State = {
  messages: Message[],
}

export default class MailComponent extends Sunshine.Component<{},{},State> {
  getState({ messages }: AppState): State {
    return { messages }
  }

  onLoadMessages(event: Event) {
    event.preventDefault()
    const query = this.refs.query.value
    this.emit(new Mail.GetMessages(query))
  }

  render(): ReactDOM.Element {
    const messages = this.state.messages.map(({ from, body }) => (
      <div className="message">
        <span className="from">{from}</span>
        <span className="body">{body}</span>
      </div>
    ))
    return <div>
      <input type="text" ref="query" id="query" />
      <button onClick={this.onLoadMessages.bind(this)}>
        Load Messages
      </button>
      <div className="messages">{messages}</div>
    </div>
  }
}

