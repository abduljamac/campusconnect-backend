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
        .then(doc => {
            const resReview = newReview
            resReview.reviewId = doc.id
            res.json(resReview)
        })
        .then(() => {
            return db.collection('reviews').add(newReview)
        })
        .catch(err => {
            res.status(500).json({ error: `Error creating the review` })
            console.error(err)
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
                    userImage: doc.data().userImage
                })
            })
            return res.json(reviews)
        })
        .catch(err => {
            console.error(err)
            res.status(500).json({ error: err.code })
        })
}

