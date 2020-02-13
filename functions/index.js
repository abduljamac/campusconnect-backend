const functions = require('firebase-functions')
const app = require('express')()
const FBAuth = require('./util/FBAuth')
const { db } = require('./util/admin')

const { signUp, logIn, addUserDetails, getUserDetails  } = require('./handlers/users')


// User Routes
app.post('/signup', signUp)
app.post('/login', logIn)
app.post('/user', FBAuth, addUserDetails)
app.get('/user/:handle', getUserDetails)


exports.api = functions.region('europe-west1').https.onRequest(app)
