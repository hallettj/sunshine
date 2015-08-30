/* @flow */

import * as Sunshine from '../react'
import { List, Record, is } from 'immutable'
import { compose, filtering, get, getter, over, set } from 'safety-lens'
import { field, toListOf, traverse } from 'safety-lens/immutable'
import type { Getter, Lens_, Traversal_ } from 'safety-lens'
import React from 'react'


// State

type AppState = Record<{ todos: List<Todo> }>
type Todo = Record<{
  title: string,
  completed: boolean,
}>

// Initialize App

var AppStateRecord = Record({ todos: List() })
var TodoRecord = Record({
  title: 'untitled',
  completed: false,
})

var initialState: AppState = new AppStateRecord()

var app = new Sunshine.App(initialState)


// Basic component

type DefaultProps = {}
type Props = {
  app: Sunshine.App<AppState>,
  pageSize: number,
}
type ComponentState = { todos: List<Todo> }

class TodoApp extends Sunshine.Component<DefaultProps,Props,ComponentState> {
  getState(appState: AppState): ComponentState {
    return {
      todos: get(todosPage(this.props.pageSize), appState)
    }
  }

  render(): React.Element {
    var todos = this.state.todos.map(todo => (
      <li>{todo.title}</li>
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
    var input = React.findDOMNode(this.refs.title)
    var title = input.value
    this.emit(new AddTodoEvent(title))
  }
}


// Lenses

var todosLens: Lens_<AppState,List<Todo>> = field('todos')

var activeTodos: Traversal_<AppState,Todo> =
  compose(todosLens, compose(traverse, filtering(todo => !todo.completed)))

function todosPage(pageSize: number): Getter<AppState,List<Todo>> {
  return getter(state => toListOf(activeTodos, state).slice(0, pageSize))
}


// Demonstrating lenses

// reading todos
var todos = get(todosLens, initialState)
assertEqual(todos, List())

// setting todos;
// `newState` is a new object with the new todos list. `initialState` is not modified.
var newState = set(todosLens, List([
  new TodoRecord({ title: 'add todo', completed: true })
]), initialState)

assertEqual(newState, new AppStateRecord({
  todos: List([
    new TodoRecord({
      title: 'add todo',
      completed: true
    })
  ])
}))

// modifying todos without replacing the whole list
var newnewState = over(todosLens, todos => todos.push(new TodoRecord({
  title: 'append a todo',
  completed: false,
})), newState)

assertEqual(newnewState, new AppStateRecord({
  todos: List([
    new TodoRecord({
      title: 'add todo',
      completed: true
    }),
    new TodoRecord({
      title: 'append a todo',
      completed: false,
    })
  ])
}))

// reading a page of active todos
var pageLens = todosPage(5)
var page = get(pageLens, newnewState)

assertEqual(page, List([
  new TodoRecord({
    title: 'append a todo',
    completed: false,
  })
]))

function assertEqual(actual,expected) {
  if (!is(actual,expected)) {
    console.error("values are not equal", actual.toJS(), expected.toJS())
    throw "assertion failure"
  }
}


// The Event type

class AddTodoEvent {
  title: string;
  constructor(title: string) {
    this.title = title
  }
}


// Event handlers

app.on(AddTodoEvent, (state, { title }) => {
  return over(todosLens, todos => todos.concat({
    title: title,
    completed: false,
  }), state)
})


// /* Other possible events */

// import Promise from 'es6-promise'
// Promise.polyfill()

// import {} from 'whatwg-fetch'
// // Tells Flow that `fetch` is a global function.
// declare var fetch: Function;


// class AddTodoWithAuthor {
//   title: string;
//   authorId: number;
//   constructor(title: string, authorId: number) {
//     this.title = title
//     this.authorId = authorId
//   }
// }

// class AppendTodo {
//   todo: Todo;
//   constructor(todo: Todo) {
//     this.todo = todo
//   }
// }

// app.on(AddTodoWithAuthor, (state, { title, authorId }) => {
//   fetch(`/users/${authorId}`).then(response => {
//     response.json().then(author => {
//       var todo = {
//         title,
//         author,
//         completed: false,
//       }
//       app.emit(new AppendTodo(todo))
//     })
//   })
// })

// app.on(AppendTodo, (state, { todo }) => {
//   return todosLens.map(state, todos => todos.push(todo))
// })


// Render the app

React.render(
  <TodoApp pageSize={10} app={app} />,
  document.getElementById('app')
)
