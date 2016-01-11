/* @flow */

export function set<T: Object>(state: T, changes: $Shape<T>): T {
  return Object.assign({}, state, changes)
}
