class Effect {
  constructor({ msg, err, body }) {
    this.msg = msg
    this.err = err
    this.body = body
  }

  map(mapper) {
    return new Effect({
      msg: this.msg,
      err: this.err,
      body: this.body.then(mapper)
    })
  }
}

const success = (msg, effect) => new Effect({
  msg,
  body: effect
})

const attempt = (successMsg, errorMsg, effect) => new Effect({
  msg: successMsg,
  err: errorMsg,
  body: effect
})

const failure = (msg, effect) => new Effect({
  err: msg,
  body: effect
})

const map = (mapper, effect) => ({
  ...effect,
  body: effect.body.then(mapper)
})

module.exports = {
  Effect,
  success,
  attempt,
  failure,
  map
}
