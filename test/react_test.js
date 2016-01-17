/* @flow */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiDom from 'chai-dom'
import './utils/dom'
import * as T from 'react-addons-test-utils'

import React from 'react'
import ReactDOM from 'react-dom'
import { get } from 'safety-lens'
import { emit, reduce } from '../sunshine'
import * as Mail from './apps/mail'
import * as Password from './apps/password'
import * as TopLevel from './apps/top-level'
import MailComponent from './views/MailComponent'
import TopLevelComponent from './views/TopLevelComponent'
import * as Todo from '../examples/simple-todo'

const expect = chai.expect
chai.use(chaiAsPromised)
chai.use(chaiDom)
declare var describe;
declare var it;

describe('sunshine-framework/react', function() {
  this.timeout(2000)

  it('displays messages', function(done) {
    const testApp = Mail.App.onEvent(
      reduce(Mail.GetAuthToken, (state, _) => (
        emit(new Mail.SetAuthToken('hunter2'))
      ))
    )
    const detachedComp = T.renderIntoDocument(
      <MailComponent app={testApp} />
    )
    const form = T.findRenderedDOMComponentWithClass(detachedComp, 'queryForm')
    expect(form).to.exist
    T.Simulate.submit(form)
    setTimeout(() => {
      const msgBodies = T.scryRenderedDOMComponentsWithClass(detachedComp, 'body')
      expect(msgBodies).to.have.length(2)
      expect(msgBodies[0]).to.have.text('hi')
      done()
    }, 50)
  })

  it('threads state and events through a hierarchy of components', function(done) {
    const detachedComp = T.renderIntoDocument(
      <TopLevelComponent app={TopLevel.App} />
    )

    const queryForm = T.findRenderedDOMComponentWithClass(detachedComp, 'queryForm')
    expect(queryForm).to.exist
    T.Simulate.submit(queryForm)

    ;(function pollForPasswordInput() {
      const passForm = T.scryRenderedDOMComponentsWithClass(detachedComp, 'passwordForm')
      if (passForm.length > 0) {
        const input = passForm[0].querySelector('[name="password"]')
        expect(input).to.exist
        input.value = 'hunter2'
        T.Simulate.submit(passForm[0])
      }
      else {
        setTimeout(pollForPasswordInput, 10)
      }
    }())

    setTimeout(() => {
      const msgBodies = T.scryRenderedDOMComponentsWithClass(detachedComp, 'body')
      expect(msgBodies).to.have.length(2)
      expect(msgBodies[0]).to.have.text('hi')
      done()
    }, 100)
  })

  it('runs a simple todo app', function(done) {
    const pageSize = 3
    const detachedComp = T.renderIntoDocument(
      <Todo.TodoApp app={Todo.app} pageSize={pageSize} />
    )

    ;[1,2,3,4].forEach(n => {
      const form = T.findRenderedDOMComponentWithTag(detachedComp, 'form')
      const input = form.querySelector('[type="text"]')
      expect(input).to.exist
      input.value = `todo ${n}`
      T.Simulate.submit(form)
    })

    setTimeout(() => {
      const todos = T.scryRenderedDOMComponentsWithTag(detachedComp, 'li')
      expect(todos).to.have.length(pageSize)
      expect(todos[0]).to.have.text('todo 1')
      done()
    }, 100)
  })
})
