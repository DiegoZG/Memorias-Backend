import mongoose from 'mongoose'

const userSchema = mongoose.Schema({
    googleId: String,
    facebookId: String
});

const User = mongoose.model('users', userSchema)

export default User;