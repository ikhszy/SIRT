function authMiddleware(req, res, next) {
  const token = req.headers.authorization;

  if (token === "Bearer super_token") {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = authMiddleware;