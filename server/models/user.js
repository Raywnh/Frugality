const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    items: [
        {   
            id: String,
            name: String,
            price: Number
        }
    ],
    budget: {
        type: Number,
        default: 0
    }

})

module.exports = mongoose.model('User', userSchema)