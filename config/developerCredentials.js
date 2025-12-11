// Static developer credentials for Bristol Utilities Developer Portal

const DEVELOPER_CREDENTIALS = {
  email: 'developer@bristolutilities.co.uk',
  password: 'dev1234',
  role: 'developer',
  name: 'Bristol Utilities Developer'
}

const validateDeveloperCredentials = (email, password) => {
  return email === DEVELOPER_CREDENTIALS.email && password === DEVELOPER_CREDENTIALS.password
}

const getDeveloperInfo = () => {
  const { password, ...info } = DEVELOPER_CREDENTIALS
  return info
}

module.exports = {
  DEVELOPER_CREDENTIALS,
  validateDeveloperCredentials,
  getDeveloperInfo,
}

