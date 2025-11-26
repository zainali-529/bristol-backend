// Static admin credentials for Bristol Utilities Admin Portal
// No database required - hardcoded credentials for simplicity

const ADMIN_CREDENTIALS = {
  email: 'admin@bristolutilities.co.uk',
  password: 'admin1234',
  role: 'admin',
  name: 'Bristol Utilities Admin'
};

// Function to validate admin credentials
const validateAdminCredentials = (email, password) => {
  return (
    email === ADMIN_CREDENTIALS.email && 
    password === ADMIN_CREDENTIALS.password
  );
};

// Function to get admin info (without password)
const getAdminInfo = () => {
  const { password, ...adminInfo } = ADMIN_CREDENTIALS;
  return adminInfo;
};

module.exports = {
  ADMIN_CREDENTIALS,
  validateAdminCredentials,
  getAdminInfo
};