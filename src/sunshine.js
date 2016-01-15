/* @flow */

import Kefir from 'kefir'
import { get, set } from 'safety-lens'

import type { Emitter, Property, Stream } from 'kefir'
import type { Lens_ } from 'safety-lens'

export type Reducer_<State, Event> = (s: State, e: Event) => ?EventResult<State>
export type Reducer<State, Event> = [Class<Event>, Reducer_<State, Event>]
export type Reducers<State> = Iterable<Reducer<State, any>>

export type Include<State, NestedState> = [App<NestedState>, Lens_<State, NestedState>]
export type Includes<State> = Iterable<Include<State, any>>

export type EventResult<State> = {
  state?: State,
  asyncUpdate?: Promise<Updater<State>>,
  events?: Iterable<Object>,
}


/*
 * An `App` instance describes how a Sunshine app is initialized and functions.
 * More specifically, an `App` is a factory for `Session` instances.
 */
class App<State> {
  initialState: State;
  reducers: Reducer<State, any>[];
  includes: Include<State, any>[];

  constructor(
    initialState: State,
    reducers: Reducers<State> = [],
    includes: Includes<State> = [],
  ) {
    this.initialState = initialState
    this.reducers = Array.from(reducers)
    this.includes = Array.from(includes)
    Object.freeze(this)
    Object.freeze(this.reducers)
    Object.freeze(this.includes)
  }

  onEvent(...reducers: Reducer<State, any>[]): App<State> {
    return new App(this.initialState, this.reducers.concat(reducers), this.includes)
  }

  include(...includes: Include<State, any>[]): App<State> {
    return new App(this.initialState, this.reducers, this.includes.concat(includes))
  }

  run(): Session<State> {
    const { initialState, reducers, includes } = this
    return new Session(initialState, reducers, includes)
  }
}


/* helpers for building reducers and includes */

function reduce<State, Event>(
  eventType: Class<Event>,
  reducer: Reducer_<State, Event>
): Reducer<State, Event> {
  return [eventType, reducer]
}

function include<TopState, NestedState>(
  app: App<NestedState>,
  lens: Lens_<TopState, NestedState>
): Include<TopState, NestedState> {
  return [app, lens]
}


/* helper functions for building EventResult<T> values */

function emit<T>(...events: Object[]): EventResult<T> {
  return { events }
}

function update<State>(newState: State): EventResult<State> {
  return { state: newState }
}

function updateAndEmit<State>(newState: State, ...events: Object[]): EventResult<State> {
  return { state: newState, events }
}

function asyncUpdate<State>(asyncUpdate: Promise<Updater<State>>): EventResult<State> {
  return { asyncUpdate }
}


/* special event types */

export type Updater<State> = (latestState: State) => State

// intentionally not exported
class AsyncUpdate<A,B> {
  updater: Updater<B>;
  lens: Lens_<A,B>;
  constructor(updater: Updater<B>, lens: Lens_<A,B>) {
    this.updater = updater
    this.lens = lens
  }
}


/* implementation */

/*
 * A `Session` instance represents a running app. It exposes state as a Kefir
 * `Property`, and accepts input events via an `emit` method.
 */
class Session<State> {
  state: Property<State>;
  events: Stream<Object>;
  currentState: State;
  _emitter: Emitter<Object>;
  _reducers: Reducer<State,any>[];
  _includes: Include<State,any>[];

  constructor(
    initialState: State,
    reducers: Reducer<State, any>[],
    includes: Include<State, any>[],
  ) {
    const input = Kefir.stream(emitter => { this._emitter = emitter })
    const output = input.scan(this._reduceAll.bind(this), initialState)
    this.state = output
    this.events = input
    this._includes = includes
    this.currentState = initialState

    // special event reducers
    this._reducers = reducers.concat([
      reduce(AsyncUpdate, (state, { updater, lens }) => {
        const newValue = updater(get(lens, state))
        return update(
          set(lens, newValue, state)
        )
      })
    ])
    Object.freeze(this._reducers)

    output.onValue(noop)  // force observables to activate
  }

  emit<Event: Object>(event: Event) {
    setTimeout(() => this._emitter.emit(event), 0);
  }

  _reduceAll(prevState: State, event: Object): State {
    const nestedUpdates = this._includes.reduce(
      (state, [app, lens]) => {
        const prevNestedState = get(lens, prevState)
        const nextNestedState = this._reduce(app.reducers, lens, prevNestedState, event)
        return set(lens, nextNestedState, state)
      },
      prevState
    )
    const idLens: Lens_<State,State> = (id: any)
    const nextState = this._reduce(this._reducers, idLens, nestedUpdates, event)
    this.currentState = nextState
    return nextState;
  }

  _reduce<T>(reducers: Reducer<T,any>[], lens: Lens_<State,T>, prevState: T, event: Object): T {
    const applicableReducers = reducers
    .filter(([klass, _]) => event instanceof klass)
    .map(([_, reducer]) => reducer)

    const nextState = applicableReducers.reduce(
      (state, reducer) => this._applyResult(lens, reducer(state, event), state),
      prevState
    )
    return nextState
  }

  _applyResult<T>(lens: Lens_<State,T>, result: ?EventResult<T>, prevState: T): T {
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
function id<T>(x: T): T { return x }

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
