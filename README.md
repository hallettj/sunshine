![SunshineJS](https://cloud.githubusercontent.com/assets/9622/7943559/11a32706-091a-11e5-8d6a-ac90fd9f9923.jpg)

Experimental framework for client-side apps, based on Flux and functional reactive programming


Why Sunshine
------------

Sunshine is the control layer (for lack of a better word) of your MVWTF app.
It is essentially an implementation of [Flux][] with a particularly functional angle.
Sunshine provides an event system to listen for user intentions,
server-side state changes, etc.;
and an event handling system that is used to update application state using
pure(-ish) functions.

Sunshine can be used with any view layer, in theory.
It has included support for React.
In the future support may be added for other frameworks,
such as [Mercury's][Mercury] or [Mithril's][Mithril] virtual DOM implementations.

[Flux]: https://facebook.github.io/flux/
[Mercury]: https://github.com/Raynos/mercury
[Mithril]: https://lhorie.github.io/mithril/

The goals of Sunshine are:

- unidirectional data flow, _à la_ Flux
- type safety with Flow
- State should stay in one place, and it should be immutable.
- pure(-ish)[*][pure-ish] JavaScript
- isomorphism (the same code can be used client-side and server-side)
- small size (don't want to have to maintain a big pile o' code)

[pure-ish]: #user-content-questions-that-someone-might-one-day-ask

Sunshine shamelessly takes ideas from [re-frame][].
Re-frame keeps all app state in one immutable data structure.
State is computed as on ongoing fold over an event stream.
Re-frame encourages implementers to think of state as an in-memory database.
Views go through a query layer to read state,
which decouples views from implementation details of app state.
There is a lot of explanation on why this works well in
[re-frame's excellent readme][re-frame readme].

Sunshine does basically the same thing.
But Sunshine brings in a new idea for the query and update layers:
lenses act as symmetric getters and setters,
which decouple both the view and event handlers from state implementation.
Apart from lenses,
the reasons for creating a new framework are to build in type-safety,
and to use pure(-ish) JavaScript.

[re-frame]: https://github.com/Day8/re-frame
[re-frame readme]: https://github.com/Day8/re-frame/blob/master/README.md


Quickstart
----------

To get started with Sunshine as quickly as possible,
clone [sunshine-template][] to get a ready-made project skeleton.

    $ git clone https://github.com/hallettj/sunshine-template.git my-app

And follow the instructions in the [sunshine-template README][] to run the
template app.
Refer back to this documentation for information on how to write code with
Sunshine.

[sunshine-template]: https://github.com/hallettj/sunshine-template
[sunshine-template README]: https://github.com/hallettj/sunshine-template/blob/master/README.md


Prerequisites
-------------

To get started from scratch, install Sunshine using npm:

    $ npm install --save hallettj/sunshine

You will also need the lens library to create lenses,
and Immutable.js to create immutable data structures:

    $ npm install --save hallettj/lens immutable

To use Sunshine, you must use a build system that can handle JSX markup and
Flow type annotations.
The recommended choice is [Babel][].
A pre-compiled version of Sunshine may be made available in the future.

[Flow][] is recommended, but not required.

[Babel]: https://babeljs.io/
[Flow]: http://flowtype.org/


What is Sunshine
----------------

At a hand-wavy level, this is what a Sunshine app looks like:

    +------------+     +--------------+      +-----------+
    |            |     |              |----->|           |
    |   server   |     |   handlers   |      |   state   |----+
    |            |     |              |<-----|           |    |
    +------------+     +--------------+      +-----------+    |
             |              ^                                 |
             |              | app.on()                        |
      emit() |              |                                 |
             |       +------------------+                     |
             |       |                  |                     | getState()
             +------>|   event stream   |                     |
                     |                  |                     |
                     +------------------+                     |
                            ^   ^                             |
    +--------------+        |   |          +---------------+  |
    |              |        |   |          |               |  |
    |   timer /    |--------+   +----------|   view /      |<-+
    |   whatever   |                       |   component   |
    |              |  emit()      emit()   |               |
    +--------------+                       +---------------+

For a more concrete look,
see the example todo app in [examples/simple-todo.js][example].

[example]: https://github.com/hallettj/sunshine/tree/master/examples/simple-todo.js

Everything in Sunshine revolves around the `Sunshine.App` class,
and around app state.
The first thing that you will do is to define an initial state.
Here is a very simple example:

```js
import { List, Record } from 'immutable'

type AppState = Record<{ todos: List<Todo> }>
type Todo = Record<{
  title: string,
  completed: boolean,
}>

var AppStateRecord = Record({ todos: List() })
var TodoRecord = Record({
  title: 'untitled',
  completed: false,
})

var initialState: AppState = new AppStateRecord()
```

And the next thing you will do is create an app:

```js
import * as Sunshine from 'sunshine/react'

var app = new Sunshine.App(initialState)
```

Normally to create React components you create subclasses of `React.Component`.
Sunshine has its own component class that provides methods for subscribing to
app state, and for emitting events.

```js
type DefaultProps = {}
type Props = {
  app: Sunshine.App<AppState>,
  pageSize: number,
}
type ComponentState = { todos: List<Todo> }

class TodoApp extends Sunshine.Component<DefaultProps,Props,ComponentState> {
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
}
```

Sunshine components need to have a reference to a `Sunshine.App` instance.
To make that happen,
pass the instance to your top-level component using the `app` prop.
(Note that there is an `app` property in the `Props` type for `TodoApp`.)

```js
React.render(
  <TodoApp pageSize={10} app={app} />
  document.getElementById('app')
)
```

There is no need to pass an `app` prop to child components -
child components and their descendents will get the reference from your
top-level component automatically.

If you are using [react-router][],
you may need to create a wrapper component to set up the `app` prop
(and any-other props you want to provide to your top-level component).

    class TodoAppWrapper extends Sunshine.Component<{},{},{}> {
      render(): React.Element {
        return (
          <TodoApp pageSize={10} app={app}/>
        )
      }
    }

    var routes = (
      <Route name="app" path="/" handler={TodoAppWrapper}>
        // whatever
      </Route>
    )

    Router.run(routes, Router.HashLocation, Root => {
      React.render(<Root/>, document.getElementById('todoapp'))
    })

[react-router]: https://github.com/rackt/react-router/

`TodoApp` uses `this.state`,
but we have not put anything in its state yet.
We will need to connect the component to app state.
But first we need to write a lens that the component can use to query state.

The component wants access to the list of todos in the app state.
But let's say that the component should only display uncompleted todos.
And the number of todos returned should be limited based on the component's
`pageSize` prop.

```js
import type { Getter, Lens_, Traversal_ } from 'lens'
import { compose, filtering } from 'lens'
import { field, toListOf, traverse } from 'lens/immutable'

var todosLens: Lens_<AppState,List<Todo>> = field('todos')

var activeTodos: Traversal_<AppState,Todo> =
  compose(todosLens, compose(traverse, filtering(todo => !todo.completed)))

function todosPage(pageSize: number): Getter<AppState,List<Todo>> {
  return getter(state => toListOf(activeTodos, state).slice(0, pageSize))
}
```

A lens is used to focus in on a specific piece of a (possibly large) data
structure.
Using a lens, that piece can be either read or (depending on the lens) updated.
The same lens can be reused on many different data structures.

`field` focuses on a property in an Immutable.js record.
The lenses above focus on the `todos` property in a value of type `AppState`.
The `activeTodos` gets a derived view by filtering that focus down to
uncompleted todos.
`todosPage` constructs a lens from a parameter,
further reducing the derived view of `activeTodos` down to just one page of
active todos.

Here are some examples of how these lenses can be used:

```js
import { get, set, over } from 'lens'

// reading todos
var todos = get(todosLens, initialState)
assertEqual(todos, List())

// setting todos;
// `newState` is a new object with the new todos list. `initialState` is not modified.
var newState = set(todosLens, List([
  new TodoRecord({ title: 'add todo', completed: true })
]), initialState)

// modifying todos without replacing the whole list
var newnewState = over(todosLens, todos => todos.push(new TodoRecord({
  title: 'append a todo',
  completed: false,
})), newState)

// reading a page of active todos
var pageLens = todosPage(5)
var page = get(pageLens, newnewState)
```

There is more information in the [lens documentation][].

[lens documentation]: https://github.com/hallettj/lens.js/blob/master/README.md

React components are connected to app state by implementing a method called
`getState`.
Use lenses to subscribe to just the little bits of state that your component
needs access to.

```js
class TodoApp extends Sunshine.Component<DefaultProps,Props,ComponentState> {

  getState(appState: AppState): ComponentState {
    return {
      todos: get(todosPage(this.props.pageSize), appState)
    }
  }

  // render() is the same as before
}
```

When your component first renders,
it will have an initial state based on the `initialState` used to construct
your `Sunshine.App` instance.
Whenever the app state updates,
Sunshine will push the updated state to your component,
and the component will re-render.

To close the loop,
components need to emit events.
To emit events, we have to define event types.

```js
class AddTodoEvent {
  title: string;
  constructor(title: string) {
    this.title = title
  }
}
```

We already have on `onSubmit` handler on a form that calls `addTodo`.
Let's implement that method.

```js
import React from 'react'

class TodoApp extends Sunshine.Component<DefaultProps,Props,ComponentState> {

    // The rest of the class is the same as before.

  addTodo(event: Event) {
    event.preventDefault()
    var input = React.findDOMNode(this.refs.title)
    var title = input.value
    this.emit(new AddTodoEvent(title))
  }

}
```

To emit events from somewhere other than a React component,
you can call `app.emit()`.

An event handler can grab that event and update app state accordingly.
A handler is just a function that takes the current app state and an event,
and returns an updated app state.
To register a handler,
you need to specify the type of event that it handles.

Remember how a lens can both read and update a data structure?

```js
app.on(AddTodoEvent, (state, { title }) => {
  return over(todosLens, todos => todos.push(new TodoRecord({
    title: title,
    completed: false,
  })), state)
})
```

The `over()` function takes a lens, an update function,
and a data structure to update.
The update function takes the existing value at the focused spot,
and returns a new value.
`over()` returns a new copy of the entire data structure
(in this case the whole app state)
with the update.
This means that lenses provide immutable updates.

*Do not modify app state in-place.*
Sunshine makes the assumption that app state is never mutated.
If state is mutated, stuff will break.
This is partly why examples use Immutable.js to implement state.
It is possible to use Sunshine without Immutable.
But with Immutable you get better performance on state updates,
and it is harder to shoot yourself in the foot.

The second argument to the event handler callback is an event object -
in this case an instance of `AddTodoEvent`.
The argument expression, `{ title }` destructures that object to pull out the
title property.
Without destructuring, the handler would like like this:

```js
app.on(AddTodoEvent, (state, event) => {
  var title = event.title
  // ...
})
```

You may have multiple handlers registered for the same event type.
In this case,
the handlers will run one at a time;
each will get the updated state from the previous handler as input.
Components will not re-render until all handlers have run.

If you do not return anything from an event handler,
Sunshine will leave the existing state unchanged.

The choice to use a synchronous signature for event handlers is deliberate.
But you are going to need asynchronous updates too.
The thing to do in those cases is to emit a second event when an async
operation completes.
For example:

```js
import Promise from 'es6-promise'
Promise.polyfill()

import {} from 'whatwg-fetch'
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

app.on(AddTodoWithAuthor, (state, { title, authorId }) => {
  fetch(`/users/${authorId}`).then(response => {
    response.json().then(author => {
      var todo = new TodoRecord({
        title,
        author,  // Imagine we added an author field to the Todo type
        completed: false,
      })
      app.emit(new AppendTodo(todo))
    })
  })
})

app.on(AppendTodo, (state, { todo }) => {
    return over(todosLens, todos => todos.push(todo), state)
})
```

And that is Sunshine.
This documentation is just a draft;
if you still have questions,
your best bet is to pester the author.
The author's number is 503-928-6714.


Consuming types
---------------

To include type information with this library, create a `.flowconfig` file in
your project root with a reference to the interface file directory in this
module.
For example:

```
[libs]
node_modules/sunshine/types/
```


Questions that someone might one day ask
----------------------------------------

### What is the -ish in pure(-ish) JavaScript?

Sunshine uses ES6, JSX, and Flow.
ES6 is JavaScript of course.
It just happens to be JavaScript of the future.
The author considers the added syntax of JSX and Flow to be small enough that
code using these can still be called "JavaScript".
Opinions may vary.

### How does Sunshine relate to Relay?

Compared to [Relay][],
Sunshine is more focused, less opinionated, and smaller.
(I presume it is smaller - I have not seen any source for Relay.)
Sunshine is intended to do one thing: manage client state.

Relay is a client and server architecture that unifies client rendering with
server state.
Sunshine makes no assumptions about server implementation.
This means that Sunshine can be used with a variety of different server architectures,
or with no server at all.
On the other hand,
this means that Sunshine gives you less out of the box than Relay does.
In particular you will have to implement your own system for synchronizing
client and server state,
or use another library that specializes in that area.

[Relay]: https://facebook.github.io/react/blog/2015/02/20/introducing-relay-and-graphql.html

### How does Sunshine relate to react-cursor?

Sunshine is sort of a mixture of [react-cursor][] and Flux.
TODO: explain this

[react-cursor]: https://github.com/dustingetz/react-cursor

### Isn't copying the entire app state on every update inefficient?

Actually, Immutable.js makes this very efficient.
See the [documentation][Immutable] for details.

[Immutable]: https://facebook.github.io/immutable-js/

### Can I use `setState()` directly?

Yes, with the caveat that you should not use Sunshine-managed state and
manually-managed state in the same component.

Sunshine components that implement `getState()` have their state managed by Sunshine.
That means that anything you set with `setState()` will be overwritten.
It is not a good idea to call `setState()` in one of these components.

Sunshine components that do not implement `getState()` can emit events,
but do not have their state managed by Sunshine.
It is fine to use `setState()` in these components -
or to use some other framework that manages state in a different way.

Regular React components
(instances of `React.Component` as opposed to `Sunshine.Component`)
are also not managed by Sunshine.
Calling `setState()` in these components is also fine.
It is likely that you will want to use components from libraries that have
their own private state -
do so without worries.

### What is the relation between `Sunshine.Component` and `React.Component`?

`Sunshine.Component` is a subclass of `React.Component`.
It just adds a little extra behavior.
All of the React stuff that you are used to is also there.
