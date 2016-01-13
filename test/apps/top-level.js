/* @flow */

import * as Sunshine from '../../src/sunshine'
import { emit, include, reduce } from '../../src/sunshine'

import { prop } from 'safety-lens/es2015'

import * as Mail     from './mail'
import * as Password from './password'


// state

export type AppState = {
  mail: typeof Mail.App.initialState,
  pass: typeof Password.App.initialState,
}

const initialState = {
  mail: Mail.App.initialState,
  pass: Password.App.initialState,
}


// app

const topLevelApp =
  new Sunshine.App(initialState)
  .include(
    include(Mail.App, prop('mail')),
    include(Password.App, prop('password'))
  )
  .onEvent(
    reduce(Mail.GetAuthToken, (state, _) => emit(new Password.RequestPassword)),
    reduce(Password.ProvidePassword, (state, { pass }) => emit(new Mail.SetAuthToken(pass)))
  )


export {
  topLevelApp as App,
}