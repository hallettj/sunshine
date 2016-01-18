/* @flow */

import React from 'react'
import ReactDOM from 'react-dom'
import { asyncResult, asyncUpdate, emit, reduce, update } from '../sunshine'
import * as Sunshine from '../react'
import { get, over, set } from 'safety-lens'
import { prop } from 'safety-lens/es2015'
import { assert } from 'chai'

import type { Lens_ } from 'safety-lens'
import type { Reducers } from '../sunshine'

// State

export type AppState = {
  todos: Todo[],
}

export type Todo = {
  title: string,
  completed: boolean,
}

const initialState: AppState = { todos: [] }


// Basic component

type DefaultProps = {}
type Props = {
  app: Sunshine.App<AppState>,
  pageSize: number,
}
type ComponentState = { todos: Todo[] }

class TodoApp extends Sunshine.Component<DefaultProps,Props,ComponentState> {
  getState(appState: AppState): ComponentState {
    return {
      todos: todosPage(this.props.pageSize, appState)
    }
  }

  render(): React.Element {
    const todos = this.state.todos.map((todo, idx) => (
      <li key={idx}>{todo.title}</li>
    ))
    return (
      <div>
        <form onSubmit={this.addTodo.bind(this)}>
          <input type="text" ref="title"/>
          <input type="submit" value="create todo"/>
        </form>
        <ul>
          {todos}
        </ul>
      </div>
    )
  }

  addTodo(event: Event) {
    event.preventDefault()
    const title = this.refs.title.value
    this.emit(new AddTodoEvent(title))
  }
}


// Lenses

const todosLens: Lens_<AppState,Todo[]> = prop('todos')

function todosPage(pageSize: number, state: AppState): Todo[] {
  const todos = get(todosLens, state)
  return todos.filter(todo => !todo.completed).slice(0, pageSize)
}


// Demonstrating lenses

// reading todos
const todos = get(todosLens, initialState)
assert.deepEqual(todos, [])

// setting todos;
// `newState` is a new object with the new todos list. `initialState` is not modified.
const newState = set(todosLens, [
  { title: 'add todo', completed: true }
], initialState)

assert.deepEqual(newState, {
  todos: [
    { title: 'add todo', completed: true }
  ]
})

// modifying todos without replacing the whole list
const newnewState = over(todosLens, todos => todos.concat({
  title: 'append a todo',
  completed: false,
}), newState)

assert.deepEqual(newnewState, {
  todos: [
    { title: 'add todo', completed: true },
    { title: 'append a todo', completed: false },
  ]
})


// The Event type

class AddTodoEvent {
  title: string;
  constructor(title: string) {
    this.title = title
  }
}


// Event reducers

const reducers: Reducers<AppState> = [
  reduce(AddTodoEvent, (state, { title }) => update(
    over(todosLens, todos => todos.concat({
      title: title,
      completed: false,
    }), state)
  ))
]




/* Other possible events */

// import {} from 'whatwg-fetch'
// Tells Flow that `fetch` is a global function.
declare var fetch: Function;


class AddTodoWithAuthor {
  title: string;
  authorId: number;
  constructor(title: string, authorId: number) {
    this.title = title
    this.authorId = authorId
  }
}

class AppendTodo {
  todo: Todo;
  constructor(todo: Todo) {
    this.todo = todo
  }
}

class LoadTodos {}

const otherPossibleReducers = [

  // Example of emitting events after an asynchronous action
  reduce(AddTodoWithAuthor, (state, { title, authorId }) => asyncResult(
    fetch(`/users/${authorId}`)
    .then(response => response.json())
    .then(author => {
        const todo = {
          title,
          author,
          completed: false,
        }
        return emit(new AppendTodo(todo))
    })
  )),

  reduce(AppendTodo, (state, { todo }) => update(
    over(todosLens, todos => todos.concat(todo), state)
  )),

  // Example of updating state with the result of an asynchronous action
  reduce(LoadTodos, (state, _) => asyncResult(
    fetch('/todos')
    .then(response => response.json())
    .then(todos => asyncUpdate(
      latestState => set(todosLens, todos, latestState)
    ))
  )),

  // Alternatively, synchronously empty todos from state, asynchronously
  // load new set via the same reducer
  reduce(LoadTodos, (state, _) => ({
    state: set(todosLens, [], state),  // synchronously empty todos list
    asyncResult: fetch('/todos')
      .then(response => response.json())
      .then(todos => asyncUpdate(
        latestState => set(todosLens, todos, latestState)  // asynchronously set new list
      ))
  })),

]


// Initialize App

const app = new Sunshine.App(initialState, reducers)


// Render the app

function toRender() {
  ReactDOM.render(
    <TodoApp pageSize={10} app={app} />,
    document.getElementById('app')
  )
}

export {
  TodoApp,
  initialState,
  toRender,
  app,
}
