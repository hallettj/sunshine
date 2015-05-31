/* @flow */

import { Compose, FilterLens, MultiLens, PathLens } from 'nanoscope'

import type { Subscriber } from '../../../sunshine'
import type { Lens } from 'nanoscope'

export type TodoState = {
  editing: boolean,
  nowShowing: Filter,
  todos: Todo[],
}

export type Filter = 'all' | 'active' | 'completed'

export type Todo = {
  completed: boolean,
  title:     string,
}


/* subscribers */

export var todos:     Lens<TodoState,Todo[]> = new PathLens('todos')
export var active:    Lens<TodoState,Todo[]> = todos.filter(isActive)
export var completed: Lens<TodoState,Todo[]> = todos.filter(isCompleted)
export var filter:    Lens<TodoState,Filter> = new PathLens('nowShowing')

export var visibleTodos: Lens<TodoState,Todo[]> =
  new MultiLens({
    filter,
    todos,
  })
  .map(({ filter, todos }) => todos.filter(isVisible(filter)))
  .getter()

export function count<T,U>(lens: Lens<T,U[]>): Subscriber<T,number> {
  return state => lens.view(state).get().reduce((total, _) => total + 1, 0)
}


/* helpers */

function isVisible(filter: Filter): (_: Todo) => boolean {
  return filter === 'active'    ? isActive
       : filter === 'completed' ? isCompleted
       : constant(true)
}
function isActive(todo: Todo): boolean { return !todo.completed }
function isCompleted(todo: Todo): boolean { return todo.completed }

function constant<T>(x: T): (_: any) => T { return (_) => x }
