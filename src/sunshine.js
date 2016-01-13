/* @flow */

import Kefir from 'kefir'
import { id, get, set } from 'safety-lens/lens'

import type { Emitter, Property, Stream } from 'kefir'
import type { Lens_ } from 'safety-lens/lens'

export type Reducer_<AppState, Event> = (s: AppState, e: Event) => ?EventResult<AppState>
export type Reducer<AppState, Event> = [Class<Event>, Reducer_<AppState, Event>]
export type Reducers<AppState> = Iterable<Reducer<AppState, any>>

export type Include<AppState, NestedState> = [App<NestedState>, Lens_<AppState, NestedState>]
export type Includes<AppState> = Iterable<Include<AppState, any>>

export type EventResult<AppState> = {
  state?: AppState,
  asyncUpdate?: Promise<Updater<AppState>>,
  events?: Iterable<Object>,
}


/*
 * An `App` instance describes how a Sunshine app is initialized and functions.
 * More specifically, an `App` is a factory for `Session` instances.
 */
class App<AppState> {
  initialState: AppState;
  reducers: Reducer<AppState, any>[];
  includes: Include<AppState, any>[];

  constructor(
    initialState: AppState,
    reducers: Iterable<Reducer<AppState, any>> = [],
    includes: Iterable<Include<AppState, any>> = [],
  ) {
    this.initialState = initialState
    this.reducers = Array.from(reducers)
    this.includes = Array.from(includes)
    Object.freeze(this)
    Object.freeze(this.reducers)
    Object.freeze(this.includes)
  }

  onEvent(...reducers: Reducer<AppState, any>[]): App<AppState> {
    return new App(this.initialState, this.reducers.concat(reducers), this.includes)
  }

  include(...includes: Include<AppState, any>[]): App<AppState> {
    return new App(this.initialState, this.reducers, this.includes.concat(includes))
  }

  run(): Session<AppState> {
    const { initialState, reducers, includes } = this
    return new Session(initialState, reducers, includes)
  }
}


/* helpers for building reducers and includes */

function reduce<AppState, Event>(
  eventType: Class<Event>,
  reducer: Reducer_<AppState, Event>
): Reducer<AppState, Event> {
  return [eventType, reducer]
}

function include<TopAppState, NestedAppState>(
  app: App<NestedAppState>,
  lens: Lens_<TopAppState, NestedAppState>
): Include<TopAppState, NestedAppState> {
  return [app, lens]
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


/* special event types */

export type Updater<AppState> = (latestState: AppState) => AppState

// intentionally not exported
class AsyncUpdate<A,B> {
  updater: Updater<B>;
  lens: Lens_<A,B>;
  constructor(updater: Updater<B>, lens: Lens_<A,B>) { this.updater = updater }
}


/* implementation */

/*
 * A `Session` instance represents a running app. It exposes state as a Kefir
 * `Property`, and accepts input events via an `emit` method.
 */
class Session<AppState> {
  state: Property<AppState>;
  events: Stream<Object>;
  currentState: AppState;
  _emitter: Emitter<Object>;
  _reducers: Reducer<AppState,any>[];
  _includes: Include<AppState,any>[];

  constructor(
    initialState: AppState,
    reducers: Reducer<AppState, any>[],
    includes: Include<AppState, any>[],
  ) {
    const input = Kefir.stream(emitter => { this._emitter = emitter })
    const output = input.scan(this._reduceAll.bind(this), initialState)
    this.state = output
    this.events = input
    this._includes = includes
    this._reducers = reducers
    this.currentState = initialState

    // special event reducers
    this._reducers.push(
      reduce(AsyncUpdate, (state, { updater, lens }) => {
        const newValue = updater(get(lens, state))
        return update(
          set(lens, newValue, state)
        )
      })
    )

    output.onValue(noop)  // force observables to activate
  }

  emit<Event: Object>(event: Event) {
    setTimeout(() => this._emitter.emit(event), 0);
  }

  _reduceAll(prevState: AppState, event: Object): AppState {
    const nestedUpdates = this._includes.reduce(
      (state, [app, lens]) => {
        const prevNestedState = get(lens, prevState)
        const nextNestedState = this._reduce(app.reducers, lens, prevNestedState, event)
        return set(lens, nextNestedState, state)
      },
      prevState
    )
    const nextState = this._reduce(this._reducers, id, nestedUpdates, event)
    this.currentState = nextState
    return nextState;
  }

  _reduce<T>(reducers: Reducer<T,any>[], lens: Lens_<AppState,T>, prevState: T, event: Object): T {
    const applicableReducers = reducers
    .filter(([klass, _]) => event instanceof klass)
    .map(([_, reducer]) => reducer)

    const nextState = applicableReducers.reduce(
      (state, reducer) => this._applyResult(lens, reducer(state, event), state),
      prevState
    )
    return nextState
  }

  _applyResult<T>(lens: Lens_<AppState,T>, result: ?EventResult<T>, prevState: T): T {
    if (!result) { return prevState }
    const { state, asyncUpdate, events } = result
    if (asyncUpdate) {
      asyncUpdate.then(
        updater => {
          this.emit(new AsyncUpdate(updater, lens))
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

function noop () {}

export {
  App,
  Session,
  asyncUpdate,
  emit,
  include,
  reduce,
  update,
  updateAndEmit,
}
