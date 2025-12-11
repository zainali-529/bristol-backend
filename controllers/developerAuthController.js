const jwt = require('jsonwebtoken')
const { validateDeveloperCredentials, getDeveloperInfo } = require('../config/developerCredentials')
const config = require('../config/config')

const developerLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' })
    }

    const isValid = validateDeveloperCredentials(email, password)
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid developer credentials' })
    }

    const dev = getDeveloperInfo()
    const token = jwt.sign({ id: 'developer_001', email: dev.email, role: dev.role, name: dev.name }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRE })

    return res.status(200).json({ success: true, message: 'Developer login successful', token, developer: dev })
  } catch (err) {
    console.error('Developer login error:', err)
    return res.status(500).json({ success: false, message: 'Server error during developer login' })
  }
}

const getDeveloperProfile = async (req, res) => {
  try {
    const dev = getDeveloperInfo()
    return res.status(200).json({ success: true, developer: { ...dev, id: 'developer_001' } })
  } catch (err) {
    console.error('Get developer profile error:', err)
    return res.status(500).json({ success: false, message: 'Server error while fetching developer profile' })
  }
}

const developerLogout = async (req, res) => {
  try {
    return res.status(200).json({ success: true, message: 'Developer logout successful' })
  } catch (err) {
    console.error('Developer logout error:', err)
    return res.status(500).json({ success: false, message: 'Server error during developer logout' })
  }
}

module.exports = { developerLogin, getDeveloperProfile, developerLogout }

