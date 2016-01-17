/* @flow */

import { set } from 'safety-lens'
import { prop } from 'safety-lens/es2015'
import * as Sunshine from '../../sunshine'
import { reduce, update, updateAndEmit } from '../../sunshine'

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
    set(prop('requestPassword'), true, state)
  )),

  reduce(GotPassword, (state, { pass }) => updateAndEmit(
    set(prop('requestPassword'), false, state),
    new ProvidePassword(pass)
  )),

]


// app
const PasswordApp = new Sunshine.App(initialState, reducers)

// Simulation of a UI component, for testing this app without React support.
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
