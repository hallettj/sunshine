/* @flow */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {
  MailApp,
  GetAuthToken,
  GetMessages,
  SetAuthToken,
  fixtureMessages,
} from './apps/mail'

const expect = chai.expect
chai.use(chaiAsPromised)
declare var describe;
declare var it;

describe('sunshine', function() {

  it('queues requests for messages', function() {
    const app = MailApp()
    app.emit(new GetMessages('from:Alice'))
    const pending = app.state.filter(
      state => state.pendingQueries.length > 0
    )
    .map(state => state.pendingQueries)
    .take(1)
    .toPromise()
    return expect(pending).to.eventually.deep.equal(['from:Alice'])
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
