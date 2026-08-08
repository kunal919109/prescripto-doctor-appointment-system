import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate admin users.
 * Reads the "atoken" request header, verifies the JWT,
 * and confirms role === "admin".
 */
const authAdmin = async (req, res, next) => {
  const { atoken } = req.headers;

  if (!atoken) {
    return res.status(401).json({ success: false, message: 'Not Authorized. Login Again.' });
  }

  try {
    const decoded = jwt.verify(atoken, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access Denied.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

export default authAdmin;
