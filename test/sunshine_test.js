/* @flow */

import chai from 'chai'
import {
  MailApp,
  GetAuthToken,
  GetMessages,
  SetAuthToken,
  fixtureMessages,
} from './apps/mail'

const expect = chai.expect
declare var describe;
declare var it;

describe('sunshine', function() {

  it('queues requests for messages', function(done) {
    const app = MailApp()
    app.emit(new GetMessages('from:Alice'))
    app.state.onValue(state => {
      const pending = state.pendingQueries
      if (pending.length > 0) {
        expect(pending[0]).to.equal('from:Alice')
        done()
      }
    })
  })

  it('emits request for authentication token', function(done) {
    const app = MailApp()
    app.emit(new GetMessages('from:Alice'))
    app._input.onValue(event => {
      if (event instanceof GetAuthToken) {
        done()
      }
    })
  })

  it('updates asynchronously', function(done) {
    const app = MailApp()
    app.emit(new GetMessages('from:Alice'))

    app._input.onValue(event => {
      if (event instanceof GetAuthToken) {
        app.emit(new SetAuthToken('hunter2'))
      }
    })

    app.state.onValue(({ messages, pendingQueries, authToken }) => {
      if (messages.length > 0) {
        expect(messages).to.deep.equal(fixtureMessages)
        expect(pendingQueries).to.be.empty
        expect(authToken).to.equal('hunter2')
        done()
      }
    })
  })

})
