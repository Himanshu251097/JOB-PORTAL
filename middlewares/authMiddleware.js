import JWT from "jsonwebtoken";

const a = 18;
const userAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    next("Auth failed");
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = JWT.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userID };
    next();
  } catch (error) {
    git;
    next("Auth failed");
  }
};

export default userAuth;
