import jsdom from 'jsdom'

const doc = jsdom.jsdom('<!doctype html><html><body><div id="main"></div></body></html>')
const win = doc.defaultView

global.document = doc
global.window = win

propagateToGlobal(win)

function propagateToGlobal(window) {
  Object.keys(window).forEach(key => {
    if (!(key in global)) {
      global[key] = window[key]
    }
  })
}
