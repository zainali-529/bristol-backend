const express = require('express')
const { body } = require('express-validator')
const { developerLogin, getDeveloperProfile, developerLogout } = require('../controllers/developerAuthController')
const { auth } = require('../middleware/auth')

const router = express.Router()

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], developerLogin)

router.get('/profile', auth, getDeveloperProfile)

router.post('/logout', auth, developerLogout)

module.exports = router

