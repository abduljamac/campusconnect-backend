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
        handle: req.body.handle,
        uni: req.body.uni
    }

    const { valid, errors } = validateSignUpData(newUser)

    if (!valid) return res.status(400).json(errors)

    const noImg = 'no-img.jpg'

    let token, userId, uni
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
            uni = req.body.uni
            return data.user.getIdToken()
        })
        .then(idToken => {
            token = idToken
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
                uni,
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

exports.updateUserDetails = (req, res) => {
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
    db.doc(`/users/${req.user.handle}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                userData.user = doc.data()
                return db.collection('reviews').where('userHandle', '==', req.user.handle).get()
            } 
        })
        .then((data) => {
            userData.reviews = []
            data.forEach((doc) => {
                userData.reviews.push(doc.data())
            })
            return res.json(userData)
        })
        .catch((err) => {
            console.error(err)
            return res.status(500).json({ error: err.code })
        })
}

exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy')
    const path = require('path')
    const os = require('os')
    const fs = require('fs')

    const busboy = new BusBoy({ headers: req.headers })

    let imageToBeUploaded = {}
    let imageFileName

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        // console.log(fieldname, file, filename, encoding, mimetype)
        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({ error: 'Wrong file type submitted' })
        }
        // my.image.png => ['my', 'image', 'png']
        const imageExtension = filename.split('.')[filename.split('.').length - 1]
        // 32756238461724837.png
        imageFileName = `${Math.round(Math.random() * 1000000000000).toString()}.${imageExtension}`
        const filepath = path.join(os.tmpdir(), imageFileName)
        imageToBeUploaded = { filepath, mimetype }
        file.pipe(fs.createWriteStream(filepath))
    })
    busboy.on('finish', () => {
        admin
            .storage()
            .bucket()
            .upload(imageToBeUploaded.filepath, {
                resumable: false,
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype
                    }
                }
            })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
                return db.doc(`/users/${req.user.handle}`).update({ imageUrl })
            })
            .then(() => {
                return res.json({ message: 'image uploaded successfully' })
            })
            .catch((err) => {
                console.error(err)
                return res.status(500).json({ error: 'something went wrong' })
            })
    })
    busboy.end(req.rawBody)
}

exports.getAllUsers = (req, res) => {
    db.collection('users')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let freelancers = []
            data.forEach(doc => {
                freelancers.push({
                    userId: doc.data().userId,
                    handle: doc.data().handle,
                    bio: doc.data().bio,
                    category: doc.data().category,
                    price: doc.data().price,
                    email: doc.data().email,
                    number: doc.data().number,
                    profileImage: doc.data().imageUrl,
                    uni: doc.data().uni
                })
            })
            return res.json(freelancers)
        })
        .catch(err => {
            // console.error(err)
            res.status(500).json({ error: err.code })
        })
}

