/* @flow */

import { set } from 'safety-lens'
import { prop } from 'safety-lens/es2015'
import * as Kefir from 'kefir'
import { EventEmitter } from 'events'
import * as Sunshine from '../../sunshine'
import { reduce, update } from '../../sunshine'

// external event stream

export type View = RootView | DiscussionView | SettingsView

class RootView {}
class DiscussionView {}
class SettingsView {}

class Router extends EventEmitter {}
const router = new Router

const routeStream = Kefir.fromEvents(router, 'route')

// app

export type State = {
  view?: View,
}

const app: Sunshine.App<State> =
  new Sunshine.App({})
  .onEvent(
    reduce(RootView, (state, view)       => update(set(prop('view'), view, state))),
    reduce(DiscussionView, (state, view) => update(set(prop('view'), view, state))),
    reduce(SettingsView, (state, view)   => update(set(prop('view'), view, state)))
  )
  .input(routeStream)

export {
  RootView,
  DiscussionView,
  SettingsView,
  router,
  app as App,
}
