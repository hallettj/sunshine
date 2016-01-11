/* @flow */

import * as Sunshine from '../../src/sunshine'
import { handle, update, updateAndEmit } from '../../src/sunshine'
import { set } from '../util'

function PasswordApp(state: $Shape<AppState>): Sunshine.App<AppState> {
  const app = new Sunshine.App(handlers, set(initialState, state))

  // simulation of a UI component
  app.state.onValue(state => {
    if (state.requestPassword) {
      promptForPassword().then(pass => app.emit(new GotPassword(pass)))
    }
  })

  return app
}


// state

type AppState = {
  requestPassword: boolean,
}

const initialState: AppState = {
  requestPassword: false,
}


// events

class RequestPassword {}  // intended to be received from upstream

class GotPassword {
  pass: string;
  constructor(pass: string) { this.pass = pass }
}

// Redundant, but demonstrates separation between event handled internally that
// updates internal state, and event that is intended to be handled upstream.
class ProvidePassword {
  pass: string;
  constructor(pass: string) { this.pass = pass }
}


// event handlers

const handlers: Sunshine.Handlers<AppState> = [

  handle(RequestPassword, (state, _) => update(
    set(state, { requestPassword: true })
  )),

  handle(GotPassword, (state, { pass }) => updateAndEmit(
    set(state, { requestPassword: false }),
    new ProvidePassword(pass)
  )),

]


// stubs

function promptForPassword(): Promise<string> {
  return Promise.resolve('hunter2')
}

export {
  PasswordApp,
  handlers,
  promptForPassword,
}
