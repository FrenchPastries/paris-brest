// This require add mapFirst, mapSecond and mapTuple to Arrays.
require('./array/extra')

const GET  = 'GET'
const POST = 'POST'

const normalizeSideEffects = sideEffects => {
  return sideEffects.map(({ msg, err, body }) => {
    return body
      .then(res => ({ msg: msg, body: res }))
      .catch(err => ({ msg: err, body: err }))
  })
}

const removeEmptySideEffect = sideEffect => {
  if (sideEffect) {
    if (Array.isArray(sideEffect)) {
      return sideEffect
    } else {
      return [ sideEffect ]
    }
  } else {
    return []
  }
}

const execReducer = reducer => ([ state, allSideEffects ], sideEffect) => {
  return reducer(sideEffect, state).mapSecond(effect =>
    allSideEffects.concat(
      removeEmptySideEffect(effect)
    )
  )
}

const accumulateSideEffects = (reducer, state) => sideEffects => {
  return sideEffects.reduce(
    execReducer(reducer),
    [ state, [] ]
  )
}

const collectSideEffects = (reducer, effects, state) => {
  return Promise.all(effects).then(accumulateSideEffects(reducer, state))
}

const solve = (reducer, sideEffects, state) => {
  if (sideEffects.length === 0) {
    return state
  } else {
    const collectedState = collectSideEffects(reducer,
      normalizeSideEffects(sideEffects),
      state
    )
    return collectedState.then(([ finalAcc, finalSideEffects ]) => {
      return prepareSolve(reducer, finalSideEffects, finalAcc)
    })
  }
}

const prepareSolve = (reducer, sideEffects, state) => {
  if (sideEffects) {
    if (Array.isArray(sideEffects)) {
      return solve(reducer, sideEffects, state)
    } else {
      return solve(reducer, [ sideEffects ], state)
    }
  } else {
    return state
  }
}

const resolve = reducer => body => {
  const [ state, sideEffects ] = reducer(body)
  return prepareSolve(reducer, sideEffects, state)
}

const create = reducer => request => {
  switch(request.method) {
    case GET:
      // Should we parse the URL and search for msg?
      // Or just fallback in switch default like now?
      return resolve(reducer)({})
    case POST:
      const body = JSON.parse(request.body)
      return resolve(reducer)(body)
  }
}

module.exports = {
  create,
  resolve
}
