/* @flow */

import * as Sunshine from '../../sunshine'
import { asyncUpdate, emit, reduce, updateAndEmit } from '../../sunshine'
import { set } from '../util'

// state

export type AppState = {
  authToken?: string,
  messages: Message[],
  pendingQueries: string[],
}

export type Message = {
  from: string,
  body: string,
}

const initialState: AppState = {
  messages: [],
  pendingQueries: [],
}


// events

class GetAuthToken {}  // intended to be reduced upstream

class GetMessages {
  query: string;
  constructor(query: string) { this.query = query }
}
class RunQueries {}
class SetAuthToken {
  authToken: string;
  constructor(authToken: string) { this.authToken = authToken }
}


// event reducers

const reducers: Sunshine.Reducers<AppState> = [

  reduce(GetMessages, (state, { query }) => {
    const newState = set(state, {
      pendingQueries: state.pendingQueries.concat(query)
    })
    return updateAndEmit(newState, new RunQueries)
  }),

  reduce(RunQueries, (state, _) => {
    const { pendingQueries, authToken } = state
    if (authToken) {
      const newState = set(state, { pendingQueries: [] })
      const messages = Promise.all(
        pendingQueries.map(q => fetch(q, authToken))
      )
      .then(mss => Array.prototype.concat.apply([], mss))
      .then(ms => state => set(state, { messages: ms }))
      return {
        state: newState,
        asyncResult: messages.then(asyncUpdate),
      }
    }
    else {
      return emit(new GetAuthToken)
    }
  }),

  reduce(SetAuthToken, (state, { authToken }) => {
    const newState = set(state, { authToken })
    return updateAndEmit(newState, new RunQueries)
  }),
]


// app

const mailApp = new Sunshine.App(initialState, reducers)


// stubs

const fixtureMessages = [
  { from: 'Joe', body: 'hi' },
  { from: 'Alice', body: '525f8e2858d56a93bca87dfb818d5bce98bef638' },
]

function fetch(query: string, authToken: string): Promise<Message[]> {
  return Promise.resolve(fixtureMessages)
}

export {
  mailApp as App,
  GetAuthToken,
  GetMessages,
  RunQueries,
  SetAuthToken,
  reducers,
  fetch,
  fixtureMessages,
}
