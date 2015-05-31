/* @flow */

import * as Sunshine from '../../../../react'
import React from 'react'
import * as S from '../state'
import TodoFooter from './TodoFooter'

import type { Todo, TodoState } from '../state'

type State = {
  todos: Todo[],
  activeCount: number,
  completedCount: number,
}

class TodoApp extends Sunshine.Component<{},{},State,TodoState> {

  getSubscribers(subscribe: Sunshine.Subscribe<TodoState>): State {
    return {
      todos: subscribe(S.visibleTodos),
      allCount: subscribe(S.count(S.todos)),
      activeCount: subscribe(S.count(S.active)),
      completedCount: subscribe(S.count(S.completed)),
    }
  }

  render(): ReactElement {
    var todos = this.state.todos
    var showMain = todos.length > 0
    var showFooter = this.state.activeCount || this.state.completedCount
    return (
      <div>
        <header id="header">
          <h1>todos</h1>
          <input
            id="new-todo"
            placeholder="what needs to be done?"
            // onKeyDown={}
            autoFocus={true}
          />
        </header>
        {showMain ? <TodoList todos={todos} activeCount={this.state.activeCount} /> : ''}
        {showFooter ? <TodoFooter/> : '' }
      </div>
    )
  }
}

type Props = { todos: Todo[], activeCount: number };

class TodoList extends Sunshine.Component<{},Props,{},any> {

  render(): ReactElement {
    var todoItems = 'todo' // TODO
    return (
      <section id="main">
        <input
          id="toggle-all"
          type="checkbox"
          onChange={this.toggleAll}
          checked={this.props.activeCount === 0}
        />
        <ul id="todo-list">
          {todoItems}
        </ul>
      </section>
    )
  }

  toggleAll() {
    // TODO
  }
}

export default TodoApp
