const Millefeuille = require('@frenchpastries/millefeuille')
const { get, post, ...Assemble } = require('@frenchpastries/assemble')
const { response, contentType } = require('@frenchpastries/millefeuille/response')
const Arrange = require('@frenchpastries/arrange')
const ParisBrest = require('../src/index')
const Effect = require('../src/effect')

const SELECT_USERS = 'SELECT_USERS'
const RETURN_USERS = 'RETURN_USERS'

const selectUsers = () => {
  return [ null,
    Effect.success(
      RETURN_USERS,
      Promise.resolve({ rows: 'Hello world!' })
    )
  ]
}

const returnUsers = users => {
  return response(users.rows)
}

const reducer = ParisBrest.resolve(({ msg, body }, state) => {
  console.log(msg)
  switch(msg) {
    case SELECT_USERS: return selectUsers()
    case RETURN_USERS: return returnUsers(body)
    default: return selectUsers()
  }
})

const routes = Assemble.routes([
  get('/', request => ({ msg: 'SELECT_USERS' })),
  post('/', request => JSON.parse(request.body))
])

const dispatchRequests = request => {
  if (request.url.pathname === '/favicon.ico') {
    return response(true)
  } else {
    const msg = routes(request)
    return reducer(request)
  }
}

const server = Millefeuille.create(
  Arrange.jsonBody(
    Arrange.jsonContentType(
      dispatchRequests
    )
  )
)

console.log('Test server started.')
