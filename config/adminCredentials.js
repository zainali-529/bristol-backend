// Static admin credentials for Bristol Utilities Admin Portal
// No database required - hardcoded credentials for simplicity

const ADMIN_CREDENTIALS = {
  email: 'hehehaha7264@gmail.com',
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

// Update admin password (in-memory)
const setAdminPassword = (newPassword) => {
  ADMIN_CREDENTIALS.password = String(newPassword);
};

// Update admin profile fields (in-memory)
const updateAdminProfile = (updates = {}) => {
  if (updates.name) ADMIN_CREDENTIALS.name = String(updates.name);
};

module.exports = {
  ADMIN_CREDENTIALS,
  validateAdminCredentials,
  getAdminInfo,
  setAdminPassword,
  updateAdminProfile,
};
