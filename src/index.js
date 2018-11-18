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
  const results = reducer(sideEffect, state)
  if (Array.isArray(results)) {
    return results.mapSecond(effect => allSideEffects.concat(removeEmptySideEffect(effect)))
  } else {
    return [ results, allSideEffects ]
  }
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

const reduce = reducer => body => {
  const results = reducer(body)
  if (Array.isArray(results)) {
    const [ state, sideEffects ] = results
    return prepareSolve(reducer, sideEffects, state)
  } else {
    return prepareSolve(reducer, undefined, results)
  }
}

const create = reducer => request => {
  switch(request.method) {
    case GET:
      // Should we parse the URL and search for msg?
      // Or just fallback in switch default like now?
      return reduce(reducer)({})
    case POST:
      const body = JSON.parse(request.body)
      return reduce(reducer)(body)
    default:
      return {
        statusCode: 500,
        headers: {},
        body: `${request.method} is not supported.`
      }
  }
}

module.exports = {
  create,
  reduce
}
