/* @flow */

import Kefir from 'kefir'

import type { Emitter, Property, Stream } from 'kefir'

export type EventResult<AppState> = {
  state?: AppState,
  asyncUpdate?: Promise<Updater<AppState>>,
  events?: Iterable<Object>,
}

export type Handler<AppState, Event> = (s: AppState, e: Event) => EventResult<AppState>
export type Handlers<AppState> = Iterable<[Class<any>, Handler<AppState,any>]>
export type WithApps<AppState> = Iterable<[App<any>, Lens_<AppState, any>]>

/* special event types */

export type Updater<AppState> = (latestState: AppState) => AppState

// intentionally not exported
class AsyncUpdate<T> {
  updater: Updater<T>;
  constructor(updater: Updater<T>) { this.updater = updater }
}


/* helper functions for building EventResult<T> values */

function emit<T>(...events: Object[]): EventResult<T> {
  return { events }
}

function update<AppState>(newState: AppState): EventResult<AppState> {
  return { state: newState }
}

function updateAndEmit<AppState>(newState: AppState, ...events: Object[]): EventResult<AppState> {
  return { state: newState, events }
}

function asyncUpdate<AppState>(asyncUpdate: Promise<Updater<AppState>>): EventResult<AppState> {
  return { asyncUpdate }
}


/* implementation */

function handle<AppState, Event>(
  eventType: Class<Event>,
  handler: Handler<AppState, Event>
): [Class<Event>, Handler<AppState, Event>] {
  return [eventType, handler]
}

function include<TopAppState, NestedAppState>(
  app: App<NestedAppState>,
  lens: Lens_<TopAppState, NestedAppState>
): [App<NestedAppState>, Lens_<TopAppState, NestedAppState>] {
  return [app, lens]
}

class App<AppState> {
  state: Property<AppState>;
  currentState: AppState;
  _input: Stream<Object>;
  _emitter: Emitter<Object>;
  _handlers: [Class<any>, Handler<AppState, any>][];

  constructor(opts: {
    initialState: AppState,
    handlers?: Handlers<AppState>,
    withApps?: WithApps<AppState>,
  }) {
    const { initialState, handlers, withApps } = opts
    this.currentState = initialState
    const input = Kefir.stream(emitter => {
      this._emitter = emitter
    })
    const output = input.scan(this._handleEvent.bind(this), initialState)
    output.onValue(_ => {})  // force observables to activate
    this.state = output
    this._input = input
    this._handlers = handlers ? Array.from(handlers) : []

    // special event handlers
    this._handlers.push(
      handle(AsyncUpdate, (state, { updater }) => update(updater(state)))
    )
  }

  emit<Event: Object>(event: Event) {
    setTimeout(() => this._emitter.emit(event), 0);
  }

  _handleEvent(prevState: AppState, event: Object): AppState {
    var handlers = this._handlers
    .filter(([klass, _]) => event instanceof klass)
    .map(([_, handler]) => handler)

    var nextState = handlers.reduce(
      (state, handler) => this._applyResult(handler(state, event), state),
      prevState
    )
    this.currentState = nextState
    return nextState;
  }

  _applyResult(result: EventResult<AppState>, prevState: AppState): AppState {
    const { state, asyncUpdate, events } = result
    if (asyncUpdate) {
      asyncUpdate.then(
        updater => {
          this.emit(new AsyncUpdate(updater))
        },
        this._emitter.error
      )
    }
    if (events) {
      for (const event of events) {
        this.emit(event)
      }
    }
    return state || prevState
  }
}

export {
  App,
  asyncUpdate,
  emit,
  handle,
  include,
  update,
  updateAndEmit,
}
