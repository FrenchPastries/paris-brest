const success = (msg, effect) => ({
  msg,
  body: effect
})

const attempt = (successMsg, errorMsg, effect) => ({
  msg: successMsg,
  err: errorMsg,
  body: effect
})

const failure = (msg, effect) => ({
  err: msg,
  body: effect
})

const map = (mapper, effect) => ({
  ...effect,
  body: effect.body.then(mapper)
})

module.exports = {
  success,
  attempt,
  failure,
  map
}
