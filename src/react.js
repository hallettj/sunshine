/* @flow */

import React from 'react'
import { compose, get } from 'safety-lens'
import * as Sunshine from './sunshine'

import type { Property, Stream } from 'kefir';
import type { Getter } from 'safety-lens'

export { App } from './sunshine'
export type Handler<AppState, Event> = (s: AppState, e: Event) => AppState

type AppStateStandin = any
type Context<AppState,FocusedState> = {
  _sunshineApp?: Sunshine.Session<AppState>,
  _sunshineLens?: Getter<AppState,FocusedState>,
}

export class Component<DefProps,Props,ComponentState:Object> extends
                                React.Component<DefProps,Props,ComponentState> {
  context:        $Shape<Context<AppStateStandin,AppStateStandin>>;
  state:          ComponentState;
  _app:           ?Sunshine.Session<AppStateStandin>;
  _hasState:      boolean;
  _changes:       ?Stream<AppStateStandin>;
  _onStateChange: ?((_: AppStateStandin) => void);

  constructor(props: Props, context: any, updater: any) {
    super(props, context, updater)

    // Set initial state
    const app = getApp(this)
    const initState = app ? app.currentState : null
    const state = initState ? this.getState(get(getLens(this), initState)) : null
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

  getChildContext(): Context<AppStateStandin,AppStateStandin> {
    return this._app ?
      { _sunshineApp: this._app, _sunshineLens: getLens(this) } : {}
  }

  componentDidMount() {
    if (this._hasState) {
      this._onStateChange = appState => {
        const componentState = this.getState(get(getLens(this), appState))
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
  _sunshineApp: React.PropTypes.instanceOf(Sunshine.Session),
  _sunshineLens: React.PropTypes.func,
}

Component.childContextTypes = {
  _sunshineApp: React.PropTypes.instanceOf(Sunshine.Session).isRequired,
  _sunshineLens: React.PropTypes.func.isRequired,
}

function getApp<AppState>(component: Component<any,any,any>): ?Sunshine.Session<AppState> {
  return component.context._sunshineApp || (
    component.props.app && component.props.app.run()
  )
}

function getLens<AppState,FocusedState>(component: Component<any,any,any>): Getter<AppState,FocusedState> {
  const { focus } = component.props
  const contextLens = component.context._sunshineLens
  if (contextLens && focus) {
    return compose(contextLens, focus)
  }
  else {
    return focus || contextLens || (Sunshine.id: any);
  }
}
