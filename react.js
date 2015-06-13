/* @flow */

import React from 'react'
import * as Sunshine from './sunshine'

import type { Property, Stream } from 'kefir';
import type { Lens } from 'nanoscope';
import type { Subscribe, Subscriber } from './sunshine'

export { App } from './sunshine'
export type Handler<AppState, Event> = (s: AppState, e: Event) => AppState
export type Subscriber<AppState, View> = Lens<AppState, View> | (s: AppState) => View
export type Subscribe<AppState> = (<View>(sub: Subscriber<AppState, View>) => View)

type AppStateStandin = Object
type Context<AppState> = {
  _sunshineApp: Sunshine.App<AppState>
}

export class Component<DefProps,Props,ComponentState> extends React.Component<DefProps,Props,ComponentState> {
  context:         Context<AppStateStandin>;
  state:           ComponentState;
  _hasSubscribers: boolean;
  _changes:        ?Stream<AppStateStandin>;
  _onStateChange:  ?((_: AppStateStandin) => void);

  constructor(props: Props, context: { app: Sunshine.App<AppStateStandin> }) {
    super(props, context)

    // Set initial state
    var initState = deref(this._app().state)
    var state = this.getSubscribers(subscribe(initState))
    if (state) { this.state = state }
    this._hasSubscribers = !!state
  }

  // Override `getSubscribers` to access app state.
  getSubscribers(subscribe: Subscribe<AppStateStandin>): ?ComponentState {
    return null
  }

  emit<Event: Object>(event: Event) {
    this._app().emit(event)
  }

  _app(): Sunshine.App<AppStateStandin> {
    return this.context._sunshineApp || this.props.app
  }

  getChildContext(): Context<AppStateStandin> {
    return { _sunshineApp: this._app() }
  }

  componentDidMount() {
    if (this._hasSubscribers) {
      this._onStateChange = appState => {
        var componentState = this.getSubscribers(subscribe(appState))
        if (componentState) {
          this.setState(componentState)
        }
      }
      var changes = this._app().state.changes()
      changes.onValue(this._onStateChange)
      this._changes = changes
    }
  }

  componentWillUnmount() {
    if (this._changes && this._onStateChange) {
      this._changes.offValue(this._onStateChange)
    }
  }
}

// In development mode, React will not provide context values to a component
// unless those values are declared with `contextTypes`.
Component.contextTypes = {
  _sunshineApp: React.PropTypes.instanceOf(Sunshine.App).isRequired
}

Component.childContextTypes = {
  _sunshineApp: React.PropTypes.instanceOf(Sunshine.App).isRequired
}

function subscribe<S>(state: S): Subscribe<S> {
  // TODO: When babel-loader catches up, use `*` instead of `any`.
  return function subscribe_<V>(sub: Subscriber<any,V>): V {
    if (typeof sub === 'function') {
      return sub(state)
    }
    else {
      return sub.view(state).get()
    }
  }
}

function deref<T>(prop: Property<T>): T {
  var value: any;
  prop.onValue(function get(v) {
    value = v
    prop.offValue(get)
  })
  return value
}
