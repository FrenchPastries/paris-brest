const success = (msg, effect) => {
  return {
    msg,
    body: effect
  }
}

const attempt = (successMsg, errorMsg, effect) => {
  return {
    msg: successMsg,
    err: errorMsg,
    body: effect
  }
}

const failure = (msg, effect) => {
  return {
    err: msg,
    body: effect
  }
}

module.exports = {
  success,
  attempt,
  failure
}
