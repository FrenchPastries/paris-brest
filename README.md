# ParisBrest

ParisBrest is a fully architecture ready-to-use on top of the MilleFeuille server to simplify your servers. If you ever use an [Elm Architecture](https://guide.elm-lang.org/architecture/)-like, you should have been wondering why no similar things exists for servers? That time has come now. You can focus on writing pure functions and let the runtime takes care of side-effects for you. Just focus on your core logic, and let the dirty details to the runtime.

# How does it works?

The Elm Architecture is focused on two things: the reducer and the state of the application. The reducer takes the state and the message that came, and do some stuff, ending up with a new state generated. The model of ParisBrest is similar: it focuses on a reducer and the state of the response you're dealing with. When a new request comes into the server, MilleFeuille converts the request into the structure used by ParisBrest, and let the reducer do its business logic. Fed with a new message, the reducer will do some computation, and returns an intermediate state and some side effects, or just a final state. If there's only a final state, it will be returned to MilleFeuille, and returned to the user. If there's some side effects, they will be executed one after the other, with the resulting intermediate state from the previous execution, allowing to accumulate data along the way.

Because code is more important and expressive than words, there's an example below. But first, we need to get the package.

# Getting Started

```bash
# For Yarn users
yarn add @frenchpastries/paris-brest
```

```bash
# For NPM users
npm install --save @frenchpastries/paris-brest
```

# A Real Example

Let's take a simple example, which say hello to every request, and which illustrates a fully working server. You can notice we use only the array function notation. This is because we aims to be the more functional as possible, and currying and other niceties are much better with arrow functions.

Ok so try to understand how the code is working, and we'll dive into the details after. You can also try the code on a new node project. Just take care of installing `millefeuille` and `paris-brest` and you can paste this into an `index.js` and play with the page on `localhost:8080`.

```javascript
const Millefeuille = require('@frenchpastries/millefeuille')
const { response } = require('@frenchpastries/millefeuille/response')
const ParisBrest   = require('@frenchpastries/paris-brest')
const Effect       = require('@frenchpastries/paris-brest/effect')

const SAY_HELLO = 'SAY_HELLO'
const RETURN_RESPONSE = 'RETURN_RESPONSE'

const sayHelloWorld = () => [ null,
  Effect.success(
    RETURN_RESPONSE,
    Promise.resolve('Hello world!')
  )
]

const reducer = ParisBrest.create(({ msg, body }, state) => {
  switch(msg) {
    case RETURN_RESPONSE: return response(body)
    case SAY_HELLO:       return sayHelloWorld()
    default:              return sayHelloWorld()
  }
})

// We're just handling the favicon request, just in case.
const dispatchRequests = request => {
  if (request.url.pathname === '/favicon.ico') {
    return response(true)
  } else {
    return reducer(request)
  }
}

const server = Millefeuille.create(dispatchRequests)
```

You maybe have understood what's happening, but let's give some explanations code blocks after code blocks.

First we're requiring the packages, and we're setting the messages used in the reducer. This is really important because defining constants like this helps with linting. Define your strings with constants, and you don't have to worry about typos later.  
We define a function `sayHelloWorld`, which returns an intermediate `null` state, and a side effect which will be resolved by the runtime. A side effect has always the same pattern: they're defined with `Effect.success`, `Effect.attempt`, or `Effect.failure`. They define respectively a side effect that always success, that may success or fail, or that always fail. They need a message for success, for success and failure, or for failure. Because a side effect is something random which can success or fail (and inherently is not pure), the last argument is always a `Promise`. Anything else will cause ParisBrest to fail. Here, we define a side effect that always success with the phrase `Hello world!` to illustrate the ability of ParisBrest to handle side effects.  
Then, the interestring part: the `reducer`. The reducer takes two variables: the message, composed of a `msg` and a `body` field, and the state, which is the intermediate state, always `null` when a new request is served. `ParisBrest.create` creates the structure to serve the message and handle side effects. This returns a classic `Request -> Response` function used in MilleFeuille.  
Finally, we're just avoiding `/favicon.ico` to be served by the reducer, and we're starting the server.

Okay, so what's happening under the hood? When you try to access a page with a GET request, the reducer will end up in the default case (it will trigger with an empty object, and an undefined state). It will return a `[ null, effect ]` tuple, and the runtime will resolve the effect. Here, the side effect success with the `RETURN_RESPONSE` message, and will go back to the reducer, this time fed with an object `{ msg: RETURN_RESPONSE, body: 'Hello world!' }` and a `null` state (from the returned value). The reducer will fall into the `RETURN_RESPONSE` case, and will return an unique response. This will be handled by the runtime, which will conclude to return the response to the server (and to the client).

Of course, we could have been continued through the chain. Let's imagine we want to add a step before returning the response and want to do another side effect, but keeping the state? Try to do it, and then, look at the answer below.

```javascript
// Here's the modified code only.

const DO_ANOTHER_THING = 'DO_ANOTHER_THING'

const sayHelloWorld = () => [ null,
  Effect.success(
    DO_ANOTHER_THING,
    Promise.resolve('Hello world!')
  )
]

const doAnotherThing = state => [ state,
  Effect.success(
    RETURN_RESPONSE,
    Promise.resolve("I'm making a ParisBrest!")
  )
]

const reducer = ParisBrest.create(({ msg, body }, state) => {
  switch(msg) {
    case DO_ANOTHER_THING: return doAnotherThing(body)
    case SAY_HELLO:        return sayHelloWorld()
    case RETURN_RESPONSE:  return response(`${state} ${body}`)
    default:               return sayHelloWorld()
  }
})
```

What's happening here is that we go into the reducer three times, resolving the Promise in the runtime. The first time, we go into the default case. We resolve the side effect, and go into the do another thing case, which returns a new side effect, will passing the `Hello world!` phrase in the intermediate state. The side effect resolve, and we go back into the reducer in the return response case, returning state and body. The state contains the `Hello world!` sentence, and the body contains `I'm making a ParisBrest!`. So we end up with `Hello world! I'm making a ParisBrest!` in your response.  
If you're unsure about all of this, run the code into your computer, you'll get a better comprehension if you're able to use and tweak the framework.

# What about side effects which can fail?

For every side effect which can fail, the framework handle it without any problem. To do it, you should use the helper `Effect.attempt`, which accept a success message and a failure message, like said above. So, let's say your side effect can fail because of a failed internet connection.

```javascript
const upload = url => {
  const file = util.promisify(fs.readFile)(path)
  return file.then(buffer => {
    const base64 = buffer.toString('base64')
    return uploadFileAsBase64(base64) // We assume uploadFileAsBase64 returns a Promise which can fail.
  })
}

const uploadFile = state => [ state, Effect.attempt(SUCCESS, FAILURE, upload(state.path)) ]
```

In the case of success, the success message is triggered with the response as body, and in case of failure, the failure message is triggered with the error as body.

# A Note About Tuples

In ParisBrest, we often use tuples, modelized as an array of two elements. ParisBrest defines two functions on arrays, `mapFirst`, and `mapSecond`, which both accepts a function, exactly like `map`, and transforming respectively the first or second element of the tuple.

# The API

ParisBrest defines two functions: `create` and `reduce`. The first one creates a handler, which convert all GET requests in empty message to the reducer (and triggers the default clause in your reducer), and extracts the message from all POST bodies and pass it to the reducer.  
The second, `reduce`, accepts a reducer, and returns the runtime, letting you to handle the details on requests, etc. It accepts a message and returns a response. This is useful combined with Assemble, or every routing system you love. You can easily defines custom routes, and creates the corresponding message needed by the runtime, getting back the response, and do whatever else you want. Let's illustrate it.

```javascript
const ParisBrest = require('@frenchpastries/paris-brest')
const Assemble = require('@frenchpastries/assemble')
const MilleFeuille = require('@frenchpastries/millefeuille')
const { response } = require('@frenchpastries/millefeuille/response')

const HOME = 'HOME'
const GET_SUPER_PAGE = 'GET_SUPER_PAGE'
const GET_MY_PAGE = 'GET_MY_PAGE'

const reducer = ParisBrest.resolve(({ msg, body }, state) => {
  switch(msg) {
    case HOME: return response('Home')
    case GET_SUPER_PAGE: return response('This is a super page')
    case GET_MY_PAGE: return response('Get my page')
  }
})

const home = { msg: HOME }
const getSuperPage = { msg: GET_SUPER_PAGE }
const getMyPage = body => { msg: GET_MY_PAGE, body }
const notFound = {
  statusCode: 404,
  headers: {},
  body: 'Page not found.'
}

const routes = Assemble.routes([
  Assemble.get('/', () => reducer(home)),
  Assemble.get('/my_super_page', () => reducer(getSuperPage)),
  Assemble.get('/my_page/:id', request => reducer(getMyPage(request.context.id))),
  Assemble.notFound(() => notFound)
])

const server = MilleFeuille.create(routes)
```

# Open Design Discussion

We want to maintain as much as possible discussions in PR and issues open to anyone. We think it's important to share why we're doing things and to discuss about how you use the framework and how you would like to use it!

# Contributing

You love ParisBrest? Feel free to contribute: open issues or propose pull requests! At French Pastries, we love hearing from you!
