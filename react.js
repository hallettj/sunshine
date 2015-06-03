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

export class Component<DefProps,Props,ComponentState,AppState> extends React.Component<DefProps,Props,ComponentState> {
  context:         ContextProps<AppState>;
  state:           ComponentState;
  _hasSubscribers: boolean;
  _changes:        ?Stream<AppState>;
  _onStateChange:  ?((_: AppState) => void);

  // In development mode, React will not provide context values to a component
  // unless those values are declared with `contextTypes`.
  static get contextTypes() {
    return {
      app: React.PropTypes.instanceOf(App).isRequired
    }
  }

  _app(): Sunshine.App<AppState> {
    return this.context.app
  }

  constructor(props: Props, context: { app: Sunshine.App<AppState> }) {
    super(props, context)

    // Set initial state
    var initState = deref(this._app().state)
    var state = this.getSubscribers(subscribe(initState))
    if (state) { this.state = state }
    this._hasSubscribers = !!state
  }

  // Override `getSubscribers` to access app state.
  getSubscribers(subscribe: Subscribe<AppState>): ?ComponentState {
    return null
  }

  emit<Event: Object>(event: Event) {
    this._app().emit(event)
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

function subscribe<S>(state: S): Subscribe<S> {
  return function subscribe_<V>(sub: Subscriber<*,V>): V {
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

type ContextProps<AppState> = {
  app: Sunshine.App<AppState>;
  children: ReactElement[];
}

export class Context<AppState> extends React.Component<{},ContextProps<AppState>,{}> {
  static get childContextTypes() {
    return {
      app: React.PropTypes.instanceOf(App).isRequired
    }
  }

  getChildContext(): { app: Sunshine.App<AppState> } {
    return { app: this.props.app }
  }

  render(): ReactElement {
    return this.props.children[0]
  }
}
