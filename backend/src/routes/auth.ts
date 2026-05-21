import { Router, type Request, type Response, type NextFunction } from "express";
import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { prisma } from "../lib/prisma.js";
import argon2 from "argon2";

const router = Router();

type AuthTokenPayload = JWTPayload & {
  id: string;
  username: string;
  email: string;
  role: "USER" | "SELLER" | "ADMIN";
};
1;

const verifyToken = async (token: string): Promise<AuthTokenPayload> => {
  const { payload } = await jwtVerify(token, getJwtSecret());

  return payload as AuthTokenPayload;
};

const getJwtSecret = () => {
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) throw new Error("Missing JWT_SECRET");

  return new TextEncoder().encode(secretKey);
};

async function generateToken(user: {
  id: string;
  username: string;
  email: string;
  role: string;
}) {
  return new SignJWT({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "7d")
    .sign(getJwtSecret());
}

type AuthenticatedRequest = Request & {
  authUser?: AuthTokenPayload;
};

const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;

    if (!token) {
      return res.status(401).json({
        message: "Authentication is required",
      });
    }

    req.authUser = await verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({
      message: "The session is invalid or expired",
    });
  }
};

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    if (!username || !password || !email) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "The password must be at least 8 characters long",
      });
    }
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (userExists) {
      return res.status(400).json({
        message: "The email address or username is already in use",
      });
    }

    const hashedPassword = await argon2.hash(password);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = await generateToken(newUser);

    return res.status(201).json({
      message: "User successfully created",
      token,
      newUser,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        username: username,
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "This user does not exist",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message: "This account is currently disabled",
      });
    }

    const passwordMatches = await argon2.verify(user.password, password);

    if (!passwordMatches) {
      return res.status(403).json({
        message: "The credentials are invalid",
      });
    }

    const token = await generateToken(user);
    return res.json({
      message: "Successfully login",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

router.patch("/profile", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const authUser = req.authUser;

    if (!authUser) {
      return res.status(401).json({
        message: "Authentication is required",
      });
    }

    const { username, email, password } = req.body as {
      username?: string;
      email?: string;
      password?: string;
    };

    const nextUsername = username?.trim();
    const nextEmail = email?.trim().toLowerCase();
    const nextPassword = password?.trim();

    if (!nextUsername && !nextEmail && !nextPassword) {
      return res.status(400).json({
        message: "At least one field is required",
      });
    }

    if (nextPassword && nextPassword.length < 8) {
      return res.status(400).json({
        message: "The password must be at least 8 characters long",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: authUser.id,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "This user does not exist",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message: "This account is currently disabled",
      });
    }

    if (nextUsername || nextEmail) {
      const existingUser = await prisma.user.findFirst({
        where: {
          id: {
            not: user.id,
          },
          OR: [
            ...(nextUsername ? [{ username: nextUsername }] : []),
            ...(nextEmail ? [{ email: nextEmail }] : []),
          ],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "The email address or username is already in use",
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        ...(nextUsername ? { username: nextUsername } : {}),
        ...(nextEmail ? { email: nextEmail } : {}),
        ...(nextPassword ? { password: await argon2.hash(nextPassword) } : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = await generateToken(updatedUser);

    return res.json({
      message: "Profile updated",
      token,
      user: updatedUser,
    });
  } catch {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

export default router;
