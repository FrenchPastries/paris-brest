const GET  = 'GET'
const POST = 'POST'

const normalizeSideEffects = sideEffects => {
  return sideEffects.map(({ msg, err, body }) => {
    return body
      .then(res => ({ msg: msg, body: res }))
      .catch(err => ({ msg: err, body: err }))
  })
}

const execReducer = reducer => ([ state, allSideEffects ], sideEffect) => {
  const [ newState, newSideEffects ] = reducer(sideEffect, state)
  return [ newState, allSideEffects.concat(newSideEffects) ]
}

const accumulateSideEffects = (reducer, accumulator) => sideEffects => {
  return sideEffects.reduce(
    execReducer(reducer),
    [ accumulator, [] ]
  )
}

const collectSideEffects = (reducer, effects, accumulator) => {
  return Promise.all(effects).then(accumulateSideEffects(reducer, accumulator))
}

const solve = (reducer, sideEffects, accumulator) => {
  if (sideEffects.length === 0) {
    return accumulator
  } else {
    const collectedState = collectSideEffects(reducer,
      normalizeSideEffects(sideEffects),
      accumulator
    )
    return collectedState.then(([ finalAcc, finalSideEffects ]) =>
      solve(reducer, finalSideEffects, finalAcc)
    )
  }
}

const resolveReducer = (reducer, body) => {
  const [ accumulator, sideEffects ] = reducer(body)
  return solve(reducer, sideEffects, accumulator)
}

const create = reducer => request => {
  switch(request.method) {
    case GET:
      return resolveReducer(reducer, { msg: 'SELECT_USERS' })
    case POST:
      const body = JSON.parse(request.body)
      return resolveReducer(reducer, body)
  }
}

module.exports = {
  create
}
