const { db } = require('../util/admin')

exports.uploadReview = (req, res) => {
    if (req.body.body.trim() === '')
        return res.status(400).json({ comment: 'Must not be empty' })

    const newReview = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        freelancerId: req.params.userId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    }

    db.doc(`/users/${req.params.userId}`)
        .get()
        .then(() => {
            return db.collection('reviews').add(newReview)
        })
        .then( docRef => {
            return db.collection('reviews').doc(`${docRef.id}`).update({
                reviewId: docRef.id
            })
        })
        .then(() => {
            res.json(newReview)
        })
        .catch(err => {
            res.status(500).json({ error: `Error creating the review` })
            // console.error(err)
        })
}

exports.getReviews = (req, res) => {
    db.collection('reviews')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let reviews = []
            data.forEach(doc => {
                reviews.push({
                    body: doc.data().body,
                    createdAt: doc.data().createdAt,
                    freelancerId: doc.data().freelancerId,
                    userHandle: doc.data().userHandle,
                    userImage: doc.data().userImage,
                    reviewId: doc.data().reviewId
                })
            })
            return res.json(reviews)
        })
        .catch(err => {
            // console.error(err)
            res.status(500).json({ error: err.code })
        })
}

exports.deleteReview = (req, res) => {
    const document = db.doc(`/reviews/${req.params.reviewId}`)
    document
        .get()
        .then(doc => {
            console.log(doc)
            if (!doc.exists) {
                return res.status(404).json({ error: 'Review not found' })
            }
            if (doc.data().userHandle !== req.user.handle) {
                return res.status(403).json({ error: 'Unauthorized' })
            } else {
                return document.delete()
            }
        })
        .then(() => {
            res.json({ message: 'Review deleted successfully' })
        })
        .catch(err => {
            // console.error(err)
            return res.status(500).json({ error: err.code })
        })
}