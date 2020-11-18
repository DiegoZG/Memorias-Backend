import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import cookieSession from 'cookie-session'
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors'
import dotenv from 'dotenv'
import postRoutes from './routes/posts.js'


//Google Facebook Auth
import User from './models/User.js'

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
import passport from 'passport';
import keys from './config/keys.js'

const app = express(); //-> DO NOT DELETE
//PASSPORT 
app.use(
    cookieSession({
        maxAge: 30 * 24 * 60 * 60 * 1000,
        keys: [keys.cookieKey]
    })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async(id, done) => {
    const user = await User.findById(id);
    done(null,user);
})

passport.use(new GoogleStrategy({
    clientID: keys.googleClientID,
    clientSecret: keys.googleClientSecret,
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    const user = await User.findOne({ googleId: profile.id })
    if(!user){
        new User( { googleId: profile.id }).save() 
    } else {
        done(null, user)
    }
    
}));

 passport.use(new FacebookStrategy({
    clientID: keys.facebookClientID,
    clientSecret: keys.facebookClientSecret,
    callbackURL: '/auth/facebook/callback'
}, async (accessToken, refreshToken, profile, done) => {
    const user = await User.findOne({ facebookId: profile.id })
    if(!user){
        new User( { facebookId: profile.id }).save() 
    } else {
        done(null, user)
    }
}));


//ROUTES
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('');
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('');
  });

app.get('/api/current_user', (req, res) => {
    res.send(req.user);
})

app.get('/api/logout', (req, res) => {
    req.logout();
    res.send(req.user);
})
//Google Auth




dotenv.config();


app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use('/posts', postRoutes);

app.get('/', (req, res) => {
    res.send('Hello to Recuerdos API')
})







const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })
.then( () => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`) ))
.catch( (error) => console.log(error.message) )

mongoose.set('useFindAndModify', false)