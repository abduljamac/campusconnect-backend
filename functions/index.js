const functions = require('firebase-functions')
const app = require('express')()
const FBAuth = require('./util/FBAuth')

const { signUp, logIn, updateUserDetails, getUserDetails, uploadImage, getAllUsers, uploadGallaryImage } = require('./handlers/users')
const { uploadReview,  getReviews } = require('./handlers/reviews')

app.post('/signup', signUp)
app.post('/login', logIn)
app.post('/user', FBAuth, updateUserDetails)
app.get('/user',FBAuth, getUserDetails)
app.post('/user/image', FBAuth, uploadImage)
app.get('/users', FBAuth, getAllUsers)
app.post('/review/:userId', FBAuth, uploadReview)
app.get('/reviews', FBAuth, getReviews)
app.post('/gallary', FBAuth, uploadGallaryImage )

exports.api = functions.region('europe-west1').https.onRequest(app)