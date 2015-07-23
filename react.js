/* @flow */

import React from 'react'
import * as Sunshine from './sunshine'

import type { Property, Stream } from 'kefir';

export { App } from './sunshine'
export type Handler<AppState, Event> = (s: AppState, e: Event) => AppState

type AppStateStandin = Object
type Context<AppState> = {
  _sunshineApp: Sunshine.App<AppState>
}

export class Component<DefProps,Props,ComponentState:Object> extends
                                React.Component<DefProps,Props,ComponentState> {
  context:        Context<AppStateStandin>;
  state:          ComponentState;
  _hasState:      boolean;
  _changes:       ?Stream<AppStateStandin>;
  _onStateChange: ?((_: AppStateStandin) => void);

  constructor(props: Props, context: Context<AppStateStandin>) {
    super(props, context)

    // Set initial state
    var app = this._app()
    var initState = app ? deref(app.state) : null
    var state = initState ? this.getState(initState) : null
    this._hasState = Boolean(state)
    if (state) {
      this.state = state
    }
  }

  // Override `getState` to subscribe to application state.
  getState(appState: AppStateStandin): ?ComponentState {}

  emit<Event: Object>(event: Event) {
    var app = this._app()
    if (app) {
      app.emit(event)
    }
    else {
      throw "Cannot emit event because no app instance was given: " + String(event)
    }
  }

  _app(): ?Sunshine.App<AppStateStandin> {
    return this.context._sunshineApp || this.props.app
  }

  getChildContext(): Context<AppStateStandin> {
    return { _sunshineApp: (this._app(): any) }
  }

  componentDidMount() {
    if (this._hasState) {
      this._onStateChange = appState => {
        var componentState = this.getState(appState)
        if (componentState) { this.setState(componentState) }
      }
      var app = this._app()
      if (app) {
        var changes = app.state.changes()
        changes.onValue(this._onStateChange)
        this._changes = changes
      }
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
  _sunshineApp: React.PropTypes.instanceOf(Sunshine.App)
}

Component.childContextTypes = {
  _sunshineApp: React.PropTypes.instanceOf(Sunshine.App).isRequired
}

function deref<T>(prop: Property<T>): T {
  var value: any;
  prop.onValue(function get(v) {
    value = v
    prop.offValue(get)
  })
  return value
}
