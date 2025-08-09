import jwt from "jsonwebtoken";

interface JWTUserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function protect(req: { cookies: { authToken?: string } }): Promise<JWTUserData> {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.authToken;
    if (!token) {
      reject(new Error("No token provided"));
      return;
    }

    if (!process.env.JWTPRIVATEKEY) {
      reject(new Error("JWT secret key not configured"));
      return;
    }

    jwt.verify(
      token,
      process.env.JWTPRIVATEKEY,
      (err: jwt.VerifyErrors | null, decoded: unknown) => {
        if (err) {
          reject(new Error(`Token verification failed: ${err.message}`));
          return;
        }

        // Type guard for JWTUserData
        if (decoded && typeof decoded === 'object' && 
            '_id' in decoded && 
            'firstName' in decoded && 
            'lastName' in decoded && 
            'email' in decoded) {
          resolve(decoded as JWTUserData);
        } else {
          reject(new Error("Invalid token payload structure"));
        }
      }
    );
  });
}