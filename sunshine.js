/* @flow */

import Kefir from 'kefir';

import type { Emitter, Property, Stream } from 'kefir';
import type { Getter } from 'lens';

export type Handler<AppState, Event> = (s: AppState, e: Event) => AppState

export class App<AppState> {
  state: Property<AppState>;
  _input: Stream<Object>;
  _emitter: Emitter<Object>;
  _handlers: [Class<any>, Handler<AppState, any>][];

  constructor(initialState: AppState, ready?: () => void) {
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
    this._handlers = []
  }

  // TODO: `klass` should be a constructor that produces values of type `Event`.
  // But Flow does not yet provide a type annotation for this.
  on<Event: Object>(klass: Class<Event>, handler: Handler<AppState, Event>) {
    this._handlers.push([klass, handler])
  }

  emit<Event: Object>(event: Event) {
    this._emitter.emit(event);
  }

  _handleEvent(prevState: AppState, event: Object): AppState {
    var handlers = this._handlers
    .filter(([klass, _]) => event instanceof klass)
    .map(([_, handler]) => handler)

    var nextState = handlers.reduce(
      (state, handler) => handler(state, event) || prevState,
      prevState
    )
    return nextState;
  }

}
