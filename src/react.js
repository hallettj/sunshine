/* @flow */

import React from 'react'
import * as Sunshine from './sunshine'

import type { Property, Stream } from 'kefir';

export { App } from './sunshine'
export type Handler<AppState, Event> = (s: AppState, e: Event) => AppState

type AppStateStandin = Object
type Context<AppState> = {
  _sunshineApp?: Sunshine.App<AppState>,
  _sunshineLens?: Lens_<AppState1,AppState2>,
}

export class Component<DefProps,Props,ComponentState:Object> extends
                                React.Component<DefProps,Props,ComponentState> {
  context:        $Shape<Context<AppStateStandin>>;
  state:          ComponentState;
  _app:           ?Sunshine._App<AppStateStandin>;
  _hasState:      boolean;
  _changes:       ?Stream<AppStateStandin>;
  _onStateChange: ?((_: AppStateStandin) => void);

  constructor(props: Props, context: Context<AppStateStandin>) {
    super(props, context)

    // Set initial state
    const app = getApp(this)
    const initState = app ? app.currentState : null
    const state = initState ? this.getState(withLens(initState, getLens(this))) : null
    this._hasState = Boolean(state)
    this._app = app
    if (state) {
      this.state = state
    }
  }

  // Override `getState` to subscribe to application state.
  getState(appState: AppStateStandin): ?ComponentState {}

  emit<Event: Object>(event: Event) {
    const app = this._app
    if (app) {
      app.emit(event)
    }
    else {
      throw "Cannot emit event because no app instance was given: " + String(event)
    }
  }

  _getApp(): ?Sunshine._App<AppStateStandin> {
    return this.context._sunshineApp || (
      this.props.app && this.props.app.run()
    )
  }

  getChildContext(): Context<AppStateStandin> {
    return { _sunshineApp: this._app, _sunshineLens: getLens(this) }
  }

  componentDidMount() {
    if (this._hasState) {
      this._onStateChange = appState => {
        const componentState = this.getState(withLens(appState, getLens(this)))
        if (componentState) { this.setState(componentState) }
      }
      var app = this._app
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
