const functions = require('firebase-functions')
const app = require('express')()
const FBAuth = require('./util/FBAuth')

const { signUp, logIn, updateUserDetails, getUserDetails, uploadImage, getFreelancers } = require('./handlers/users')

app.post('/signup', signUp)
app.post('/login', logIn)
app.post('/user', FBAuth, updateUserDetails)
app.get('/user',FBAuth, getUserDetails)
app.post('/user/image', FBAuth, uploadImage)
app.get('/freelancers', FBAuth, getFreelancers)


exports.api = functions.region('europe-west1').https.onRequest(app)