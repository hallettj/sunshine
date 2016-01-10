/* @flow */

import Kefir from 'kefir'

import type { Emitter, Property, Stream } from 'kefir'

export type EventResult<AppState> = {
  state?: AppState,
  asyncUpdate?: Promise<(_: AppState) => AppState>,
  events?: Iterable<Object>,
}

export type Handler<AppState, Event> = (s: AppState, e: Event) => EventResult<AppState>
export type Handlers<AppState> = Iterable<[Class<any>, Handler<AppState,any>]>


// special event types

export type Updater<AppState> = (latestState: AppState) => AppState

class AsyncUpdate<T> {
  updater: Updater<T>;
  constructor(updater: Updater<T>) { this.updater = updater }
}


// helper functions for building EventResult<T> values

function handle<AppState, Event>(
  eventType: Class<Event>,
  handler: Handler<AppState, Event>
): [Class<Event>, Handler<AppState, Event>] {
  return [eventType, handler]
}

function emit<T>(...events: Object[]): EventResult<T> {
  return { events }
}

function update<AppState>(newState: AppState): EventResult<AppState> {
  return { state: newState }
}

function updateAndEmit<AppState>(newState: AppState, ...events: Object[]): EventResult<AppState> {
  return { state: newState, events }
}

function asyncUpdate<AppState>(promise: Promise<AppState>): EventResult<AppState> {
  return { promise }
}


class App<AppState> {
  state: Property<AppState>;
  currentState: AppState;
  _input: Stream<Object>;
  _emitter: Emitter<Object>;
  _handlers: [Class<any>, Handler<AppState, any>][];

  constructor(handlers: Handlers<AppState>, initialState: AppState, ready?: () => void) {
    this.currentState = initialState
    var isReady = false
    var input = Kefir.stream(emitter => {
      this._emitter = emitter
      if (!isReady) {
        isReady = true
        setTimeout(ready, 0)
      }
      return () => undefined
    })
    var output = input.scan(this._handleEvent.bind(this), initialState)
    this.state = output
    this._input = input
    this._handlers = Array.from(handlers)
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
      asyncUpdate.then(updater => this._emitter.emit(new AsyncUpdate(updater)))
    }
    if (events) {
      for (const event of events) {
        this._emitter.emit(event)
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
  update,
  updateAndEmit,
}
