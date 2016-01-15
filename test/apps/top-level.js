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


// lenses

const mailState = prop('mail')
const passState = prop('pass')


// app

const topLevelApp =
  new Sunshine.App(initialState)
  .include(
    include(Mail.App, mailState),
    include(Password.App, passState),
  )
  .onEvent(
    reduce(Mail.GetAuthToken, (state, _) => emit(new Password.RequestPassword)),
    reduce(Password.ProvidePassword, (state, { pass }) => emit(new Mail.SetAuthToken(pass))),
  )


export {
  topLevelApp as App,
  mailState,
  passState,
}
