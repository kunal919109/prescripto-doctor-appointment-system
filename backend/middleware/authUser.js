import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate patient users.
 * Reads the "token" request header, verifies the JWT,
 * confirms role === "patient", and attaches req.userId.
 */
const authUser = async (req, res, next) => {
  const { token } = req.headers;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not Authorized. Login Again.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Access Denied.' });
    }

    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

export default authUser;
