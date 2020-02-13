const { db, admin } = require('../util/admin')
const config = require('../util/config')
const firebase = require('firebase')
firebase.initializeApp(config)

const { validateSignUpData, validateLoginData, reduceUserDetails } = require('../util/validations')

exports.signUp = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    }

    const { valid, errors } = validateSignUpData(newUser)

    if (!valid) return res.status(400).json(errors)

    const noImg = 'no-img.png'

    let token, userId
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ handle: `the handle is already taken` })
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid
            return data.user.getIdToken()
        })
        .then(idToken => {
            token = idToken
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
                userId
            }
            return db.doc(`/users/${newUser.handle}`).set(userCredentials)
        })
        .then(() => {
            return res.status(201).json({ token })
        })
        .catch(err => {
            console.error(err)
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: `email is already in use` })
            } else {
                return res.status(500).json({ error: 'Something went wrong , please try again' })
            }
        })
}


exports.logIn = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    }

    const { valid, errors } = validateLoginData(user)

    if (!valid) return res.status(400).json(errors)

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken()
        })
        .then(token => {
            return res.json({ token })
        })
        .catch(err => {
            console.error(err)
            if (err.code === 'auth/wrong-password') {
                return res.status(403).json({ general: 'Wrong credentials, please try again' })
            } 
            else res.status(500).json({ error: err.json })
        })
}

exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body)

    db.doc(`/users/${req.user.handle}`)
        .update(userDetails)
        .then(() => {
            return res.json({ message: 'Details added successfully' })
        })
        .catch(err => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}


exports.getUserDetails = (req, res) => {
    let userData = {}
    db.doc(`/users/${req.params.handle}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                userData.user = doc.data()
                return db
                    .collection('users')
                    .where('userHandle', '==', req.params.handle)
                    .orderBy('createdAt', 'desc')
                    .get();
            } else {
                return res.status(404).json({ errror: 'User not found' })
            }
        })
        .then((data) => {
            userData.reviews = [];
            data.forEach((doc) => {
                userData.tweets.push({
                    userHandle: doc.data().userHandle,
                    bio: doc.data().bio,
                    category: doc.data().category,
                    price: doc.data().price,
                    email: doc.data().email,
                });
            });
            return res.json(userData)
        })
        .catch((err) => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}