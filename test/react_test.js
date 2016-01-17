/* @flow */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import './utils/dom'
import {
  findRenderedDOMComponentWithTag,
  renderIntoDocument,
} from 'react-addons-test-utils'

import React from 'react'
import ReactDOM from 'react-dom'
import { get } from 'safety-lens'
import * as Mail from './apps/mail'
import * as Password from './apps/password'
import * as TopLevel from './apps/top-level'
import MailComponent from './views/MailComponent'

const expect = chai.expect
chai.use(chaiAsPromised)
declare var describe;
declare var it;

describe('sunshine-framework/react', function() {
  this.timeout(100)

  it('displays messages', function() {
    // console.trace(console.log('foo'))
    // try {
    // console.trace(
      ReactDOM.render(
        <MailComponent app={Mail.App} />,
        document.getElementById('main')
      )
    // )
    // }
    // catch (e) {
    //   console.log(e, e.trace)
    // }
    // const detachedComp = renderIntoDocument(
    //   <MailComponent app={Mail.App} />
    // )
    // const button = findRenderedDOMComponentWithTag(detachedComp, 'button')
    // expect(button).to.exist
    // console.log(button)
  })
})
