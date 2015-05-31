/* @flow */

import React from 'react/addons'
import * as Sunshine from '../../../../react'

import type { Todo } from '../state'

type Props = {
  editing:  boolean,
  editText: string,
  todo:     Todo,
}

class TodoItem extends Sunshine.Component {
  props: Props;

  render(): ReactElement {
    return (
      <li className={React.addons.classSet({
        completed: this.props.todo.completed,
        editing:   this.props.editing,
      })}>
        <div className="view">
          <input
            className="toggle"
            type="checkbox"
            checked={this.props.todo.completed}
            onChange={this.onToggle.bind(this)}
          />
          <label onDoubleClick={this.handleEdit.bind(this)}>
            {this.props.todo.title}
          </label>
          <button className="destroy" onClick={this.onDestroy.bind(this)} />
        </div>
        <input
          className="edit"
          value={this.props.editText}
          onBlur={this.handleSubmit.bind(this)}
          onChange={this.handleChange.bind(this)}
          onKeyDown={this.handleKeyDown.bind(this)}
        />
      </li>
    )
  }

  onToggle() {
    // TODO
  }

  onDestroy() {
    // TODO
  }

  handleEdit() {
    // TODO
  }

  handleSubmit() {
    // TODO
  }

  handleChange() {
    // TODO
  }

  handleKeyDown() {
    // TODO
  }
}

export default TodoItem
