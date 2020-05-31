var admin = require("firebase-admin")
var serviceAccount = require("./serviceAccountKey.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://campusconnect-backend.firebaseio.com",
  storageBucket: "campusconnect-backend.appspot.com"
})

const db = admin.firestore()

module.exports = { admin, db }