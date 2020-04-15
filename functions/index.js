const functions = require('firebase-functions')
const app = require('express')()
const FBAuth = require('./util/FBAuth')
const { db } = require('./util/admin')

const { signUp, logIn, addUserDetails, getUserDetails, uploadImage, getFreelancers } = require('./handlers/users')


// User Routes
app.post('/signup', signUp)
app.post('/login', logIn)
app.post('/user', FBAuth, addUserDetails)
app.get('/user',FBAuth, getUserDetails)
app.post('/user/image', FBAuth, uploadImage)
app.get('/freelancers', FBAuth, getFreelancers)


exports.api = functions.region('europe-west1').https.onRequest(app)