import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate doctor users.
 * Reads the "dtoken" request header, verifies the JWT,
 * confirms role === "doctor", and attaches req.docId.
 */
const authDoctor = async (req, res, next) => {
  const { dtoken } = req.headers;

  if (!dtoken) {
    return res.status(401).json({ success: false, message: 'Not Authorized. Login Again.' });
  }

  try {
    const decoded = jwt.verify(dtoken, process.env.JWT_SECRET);

    if (decoded.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Access Denied.' });
    }

    req.docId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

export default authDoctor;
