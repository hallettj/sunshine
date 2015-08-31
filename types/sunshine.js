import type { Property } from 'kefir'

declare module 'sunshine' {
  declare type Handler<AppState, Event> = (s: AppState, e: Event) => AppState;

  declare class App<AppState> {
    state: Property<AppState>;
    currentState: AppState;

    constructor(initialState: AppState, ready?: () => void): void;

    on<Event: Object>(klass: Class<Event>, handler: Handler<AppState, Event>): void;
    emit<Event: Object>(event: Event): void;
  }
}
