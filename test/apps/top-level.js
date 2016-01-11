/* @flow */

import * as Sunshine from '../../src/sunshine'
import { handle, emit } from '../../src/sunshine'
import { set } from '../util'

import { MailApp, GetAuthToken, SetAuthToken } from './mail'
import { PasswordApp, ProvidePassword, RequestPassword } from './password'

function TopLevelApp(state: $Shape<AppState>): Sunshine.App<AppState> {
  return new Sunshine.App({ handlers, withApps, initialState: set(initialState, state) })
}


// state

type AppState = {}
const initialState = {}

// nested apps

const withApps = []


// event handlers

const handlers: Sunshine.Handlers<AppState> = [

  handle(GetAuthToken, (state, _) => emit(new RequestPassword)),

  handle(ProvidePassword, (state, { pass }) => emit(new SetAuthToken(pass))),

]

export {
  TopLevelApp,
}
