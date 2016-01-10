/* @flow */

import * as Sunshine from '../../src/sunshine'
import { emit, handle, updateAndEmit } from '../../src/sunshine'

function MailApp(onReady: Function): Sunshine.App<AppState> {
  return new Sunshine.App(handlers, initialState, onReady)
}


// state

type AppState = {
  authToken?: string,
  messages: Message[],
  pendingQueries: string[],
}

type Message = {
  from: string,
  body: string,
}

const initialState: AppState = {
  messages: [],
  pendingQueries: [],
}


// events

class GetAuthToken {}  // intended to be handled upstream

class GetMessages {
  query: string;
  constructor(query: string) { this.query = query }
}
class RunQueries {}
class SetAuthToken {
  authToken: string;
  constructor(authToken: string) { this.authToken = authToken }
}


// event handlers

const handlers: Sunshine.Handlers<AppState> = [
  handle(GetMessages, (state, { query }) => {
    const newState = set(state, {
      pendingQueries: state.pendingQueries.concat(query)
    })
    return updateAndEmit(newState, new RunQueries)
  }),

  handle(RunQueries, (state, _) => {
    const { pendingQueries, authToken } = state
    if (authToken) {
      const newState = set(state, { pendingQueries: [] })
      const asyncUpdate = Promise.all(
        pendingQueries.map(q => fetch(q, authToken))
      )
      .then(ms => state => set(state, { messages: ms }))
      return {
        state: newState,
        async: asyncUpdate,
      }
    }
    else {
      return emit(new GetAuthToken/*, new RunQueries */)
      // TODO: can we hook in a callback that runs after GetAuthToken updates
      // state?
      // Alternatively, create separate SetAuthToken event type
    }
  }),

  handle(SetAuthToken, (state, { authToken }) => {
    const newState = set(state, { authToken })
    return updateAndEmit(newState, new RunQueries)
  }),
]


// stubs

function fetch(query: string, authToken: string): Promise<Message[]> {
  return Promise.resolve([
    { from: 'Joe', body: 'hi' },
    { from: 'Alice', body: '525f8e2858d56a93bca87dfb818d5bce98bef638' },
  ])
}


// helpers

function set<T: Object>(state: T, changes: $Shape<T>): T {
  return Object.assign({}, state, changes)
}

export {
  GetAuthToken,
  GetMessages,
  RunQueries,
  MailApp,
  handlers,
  fetch,
}
