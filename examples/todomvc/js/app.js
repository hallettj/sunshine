/* @flow */

import * as Sunshine from '../../../react'
import React from 'react'
import RouterRouter from 'routerrouter'
import TodoApp from './components/TodoApp'
import * as S from './state'

import type { Filter, TodoState } from './state'

var app = new Sunshine.App(({
  editing: false,
  nowShowing: 'all',
  todos: [],
} : TodoState))


/* routes */

var router = new RouterRouter({
  routes: {
    '': 'all',
    'active',
    'completed',
  },
  all() { app.emit(new FilterEvent('all')) },
  active() { app.emit(new FilterEvent('active')) },
  completed() { app.emit(new FilterEvent('completed')) },
})


/* render */

React.render(
  <Sunshine.Context app={app}>
    <TodoApp/>
  </Sunshine.Context>,
  document.getElementById('todoapp')
)


/* event types */

class FilterEvent {
  filter: Filter;
  constructor(filter: Filter) { this.filter = filter }
}


/* handlers */

app.on(FilterEvent, (state, { filter }) => {
  S.filter.view(state).set(filter)
})
