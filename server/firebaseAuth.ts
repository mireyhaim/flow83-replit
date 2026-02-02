import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { sendMentorWelcomeEmail } from "./email";

interface FirebaseTokenPayload {
  user_id: string;
  email?: string;
  name?: string;
  picture?: string;
  exp: number;
  iss: string;
  aud: string;
  sub: string;
}

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const GOOGLE_CERTS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function validateFirebaseConfig() {
  if (!FIREBASE_PROJECT_ID) {
    console.warn("[Firebase Auth] FIREBASE_PROJECT_ID not set - Firebase authentication disabled");
    return false;
  }
  return true;
}

const isFirebaseConfigured = validateFirebaseConfig();

const client = jwksClient({
  jwksUri: GOOGLE_CERTS_URL,
  cache: true,
  cacheMaxAge: 86400000,
  rateLimit: true,
  jwksRequestsPerMinute: 5
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!header.kid) {
    callback(new Error("No kid in token header"));
    return;
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

async function verifyFirebaseToken(idToken: string): Promise<FirebaseTokenPayload | null> {
  if (!FIREBASE_PROJECT_ID) {
    console.error("Firebase token verification failed: FIREBASE_PROJECT_ID not configured");
    return null;
  }
  
  return new Promise((resolve) => {
    jwt.verify(
      idToken,
      getKey,
      {
        algorithms: ["RS256"],
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
        audience: FIREBASE_PROJECT_ID,
      },
      (err, decoded) => {
        if (err) {
          console.error("Firebase token verification failed:", err.message);
          resolve(null);
          return;
        }
        
        const payload = decoded as any;
        
        if (!payload.sub || !payload.user_id) {
          console.error("Firebase token missing required claims");
          resolve(null);
          return;
        }
        
        resolve({
          user_id: payload.user_id || payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          exp: payload.exp,
          iss: payload.iss,
          aud: payload.aud,
          sub: payload.sub
        });
      }
    );
  });
}

async function upsertFirebaseUser(decodedToken: FirebaseTokenPayload) {
  const email = decodedToken.email || "";
  const displayName = decodedToken.name || "";
  const [firstName, ...lastNameParts] = displayName.split(" ");
  const lastName = lastNameParts.join(" ");
  const profileImageUrl = decodedToken.picture || "";
  
  if (email) {
    const existingUserByEmail = await storage.getUserByEmail(email);
    if (existingUserByEmail) {
      await storage.updateUser(existingUserByEmail.id, { email });
      return existingUserByEmail.id;
    }
  }
  
  const userId = `firebase_${decodedToken.user_id}`;
  const existingUser = await storage.getUser(userId);
  const isNewUser = !existingUser;
  
  if (existingUser) {
    await storage.updateUser(userId, { email });
  } else {
    await storage.upsertUser({
      id: userId,
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      profileImageUrl,
    });
  }
  
  if (isNewUser && email) {
    const dashboardLink = process.env.REPLIT_DOMAINS?.split(',')[0] 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}/dashboard`
      : 'https://flow83.com/dashboard';
    
    sendMentorWelcomeEmail({
      mentorEmail: email,
      mentorName: firstName || 'מנטור',
      dashboardLink,
      language: 'he'
    }).catch(err => console.error('Failed to send mentor welcome email:', err));
  }
  
  return userId;
}

export function registerFirebaseAuthRoutes(app: Express) {
  app.post("/api/auth/firebase", async (req, res) => {
    try {
      if (!isFirebaseConfigured) {
        return res.status(503).json({ message: "Firebase authentication is not configured" });
      }
      
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid authorization header" });
      }
      
      const idToken = authHeader.substring(7);
      const decodedToken = await verifyFirebaseToken(idToken);
      
      if (!decodedToken) {
        return res.status(401).json({ message: "Invalid or expired Firebase token" });
      }
      
      const userId = await upsertFirebaseUser(decodedToken);
      
      const sessionExpiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
      
      const user: any = {
        claims: {
          sub: userId,
          email: decodedToken.email,
          first_name: decodedToken.name?.split(" ")[0] || "",
          last_name: decodedToken.name?.split(" ").slice(1).join(" ") || "",
          profile_image_url: decodedToken.picture || "",
        },
        access_token: idToken,
        expires_at: sessionExpiresAt,
        auth_type: "firebase"
      };
      
      (req as any).login(user, (err: any) => {
        if (err) {
          console.error("Session login error:", err);
          return res.status(500).json({ message: "Session creation failed" });
        }
        res.json({ success: true, userId });
      });
    } catch (error: any) {
      console.error("Firebase auth error:", error);
      res.status(500).json({ message: error.message || "Authentication failed" });
    }
  });
}

export const isFirebaseAuthenticated: RequestHandler = async (req, res, next) => {
  if ((req as any).isAuthenticated?.()) {
    return next();
  }
  
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith("Bearer ")) {
    const idToken = authHeader.substring(7);
    const decodedToken = await verifyFirebaseToken(idToken);
    
    if (decodedToken) {
      (req as any).firebaseUser = decodedToken;
      (req as any).user = {
        claims: {
          sub: `firebase_${decodedToken.user_id}`,
          email: decodedToken.email,
        }
      };
      return next();
    }
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};
