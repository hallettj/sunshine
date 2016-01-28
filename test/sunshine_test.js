/* @flow */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { get } from 'safety-lens'
import * as Mail from '../examples/app-composition/mail'
import * as Password from '../examples/app-composition/password'
import * as TopLevel from '../examples/app-composition/top-level'
import * as InputEvents from '../examples/input-events'

const expect = chai.expect
chai.use(chaiAsPromised)
declare var describe;
declare var it;

describe('sunshine-framework', function() {
  this.timeout(100)

  it('queues requests for messages', function() {
    const session = Mail.App.run()
    session.emit(new Mail.GetMessages('from:Alice'))
    const pending = session.state.filter(
      state => state.pendingQueries.length > 0
    )
    .map(state => state.pendingQueries)
    .take(1)
    .toPromise()
    return expect(pending).to.eventually.deep.equal(['from:Alice'])
  })

  it('emits request for authentication token', function(done) {
    const session = Mail.App.run()
    session.emit(new Mail.GetMessages('from:Alice'))
    session.events.onValue(event => {
      if (event instanceof Mail.GetAuthToken) {
        done()
      }
    })
  })

  it('updates asynchronously', function(done) {
    const session = Mail.App.run()
    session.emit(new Mail.GetMessages('from:Alice'))

    session.events.onValue(event => {
      if (event instanceof Mail.GetAuthToken) {
        session.emit(new Mail.SetAuthToken('hunter2'))
      }
    })

    session.state.onValue(({ messages, pendingQueries, authToken }) => {
      if (messages.length > 0) {
        expect(messages).to.deep.equal(Mail.fixtureMessages)
        expect(pendingQueries).to.be.empty
        expect(authToken).to.equal('hunter2')
        done()
      }
    })
  })

  it('composes apps', function() {
    const session = TopLevel.App.run()
    Password.runUi(session, TopLevel.passState)
    session.emit(new Mail.GetMessages('from:Alice'))

    const authToken = session.state.filter(
      state => !!get(TopLevel.mailState, state).authToken
    )
    .map(state => get(TopLevel.mailState, state).authToken)
    .take(1)
    .toPromise()

    return expect(authToken).to.eventually.equal('hunter2')
  })

  it('accepts input event streams', function() {
    const session = InputEvents.App.run()
    const rootView = new InputEvents.RootView
    const discussionView = new InputEvents.DiscussionView

    InputEvents.router.emit('route', rootView)
    InputEvents.router.emit('route', discussionView)

    const view = session.state.filter(
      state => state.view instanceof InputEvents.DiscussionView
    )
    .map(state => state.view)
    .take(1)
    .toPromise()
    return expect(view).to.eventually.equal(discussionView)
  })

})
