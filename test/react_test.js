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

const expect = chai.expect
chai.use(chaiAsPromised)
chai.use(chaiDom)
declare var describe;
declare var it;

describe('sunshine-framework/react', function() {
  this.timeout(100)

  it('displays messages', function(done) {
    const testApp = Mail.App.onEvent(
      reduce(Mail.GetAuthToken, (state, _) => (
        emit(new Mail.SetAuthToken('hunter2'))
      ))
    )
    const detachedComp = T.renderIntoDocument(
      <MailComponent app={testApp} />
    )
    const button = T.findRenderedDOMComponentWithTag(detachedComp, 'button')
    expect(button).to.exist
    T.Simulate.click(button)
    setTimeout(() => {
      const msgBodies = T.scryRenderedDOMComponentsWithClass(detachedComp, 'body')
      expect(msgBodies).to.have.length(2)
      expect(msgBodies[0]).to.have.text('hi')
      done()
    }, 50)
  })
})
