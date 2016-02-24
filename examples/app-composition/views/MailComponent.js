/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
import * as Sunshine from '../../../react'
import * as Mail from '../mail'

type State = {
  messages: Mail.Message[],
}

export default class MailComponent extends Sunshine.Component<{},{},State> {
  getState({ messages }: Mail.AppState): State {
    return { messages }
  }

  onLoadMessages(event: Event) {
    event.preventDefault()
    const query = this.refs.query.value
    this.emit(new Mail.GetMessages(query))
  }

  render(): React.Element {
    const messages = this.state.messages.map(({ from, body }, idx) => (
      <div className="message" key={idx}>
        <span className="from">{from}</span>
        <span className="body">{body}</span>
      </div>
    ))
    return <div>
      <form className="queryForm" onSubmit={this.onLoadMessages.bind(this)}>
        <input type="text" ref="query" id="query" />
        <input type="submit" value="Load Messages" />
      </form>
      <div className="messages">{messages}</div>
    </div>
  }
}

