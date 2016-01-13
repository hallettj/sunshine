/* @flow */

import * as Sunshine from '../../src/sunshine'
import { reduce, update, updateAndEmit } from '../../src/sunshine'
import { set } from '../util'

import { get } from 'safety-lens/lens'

import type { Getter } from 'safety-lens/lens'

// state

export type AppState = {
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

// Redundant, but demonstrates separation between event reduced internally that
// updates internal state, and event that is intended to be reduced upstream.
class ProvidePassword {
  pass: string;
  constructor(pass: string) { this.pass = pass }
}


// event reducers

const reducers: Sunshine.Reducers<AppState> = [

  reduce(RequestPassword, (state, _) => update(
    set(state, { requestPassword: true })
  )),

  reduce(GotPassword, (state, { pass }) => updateAndEmit(
    set(state, { requestPassword: false }),
    new ProvidePassword(pass)
  )),

]


// app
const PasswordApp = new Sunshine.App(initialState, reducers)

// simulation of a UI component
function runUi<T>(session: Sunshine.Session<T>, lens: Getter<T,AppState>) {
  session.state.onValue(state => {
    const passState = get(lens, state)
    if (passState.requestPassword) {
      promptForPassword().then(pass => session.emit(new GotPassword(pass)))
    }
  })
}


// stubs

function promptForPassword(): Promise<string> {
  return Promise.resolve('hunter2')
}

export {
  PasswordApp as App,
  ProvidePassword,
  RequestPassword,
  promptForPassword,
  reducers,
  runUi,
}
