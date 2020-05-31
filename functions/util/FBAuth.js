const { admin, db } = require('./admin')

module.exports = (req, res, next) => {
    let userToken;
    
    if(req.headers.authorization && req.headers.authorization.startsWith('User ')){
        userToken = req.headers.authorization.split('User ')[1]

    } else {
        console.log('User token not found')
        return res.status(402).json ({ error:'Unauthorized'})
    }

    admin.auth().verifyIdToken(userToken)
        .then( decodedToken => {
            req.user = decodedToken
            console.log('Decoded Token', decodedToken)
            return db.collection('users')
                .where('userId', '==', req.user.uid)
                .limit(1)
                .get()
        })
        .then( data => {
            req.user.handle = data.docs[0].data().handle
            req.user.imageUrl = data.docs[0].data().imageUrl
            return next()
        })
        .catch( err => {
            console.error('Error while verifying token ', err)
            return res.status(403).json(err)
        })
}