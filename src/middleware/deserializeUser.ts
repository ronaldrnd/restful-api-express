import { NextFunction, Request, Response } from "express";
import { get } from "lodash";
import { verifyJwt } from "../utils/jwt.utils";
import log from "../utils/logger";
import { reIssueAccessToken } from "../service/session.service";

const deserializeUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessToken = get(req, "headers.authorization", "").replace(
    /^Bearer\s/,
    ""
  );

  const refreshToken = get(req, "headers.x-refresh") as string

  console.log("access",accessToken)

  if (!accessToken) {
    return next();
  }

  const { decoded, expired } = verifyJwt(accessToken);

  if (decoded) {
    res.locals.user = decoded;

    return next();
  }

  if (expired && refreshToken) {
    const newAccessToken = await reIssueAccessToken({
      refreshToken
    }) as string;

    if (newAccessToken) {
      res.setHeader("x-access-token", newAccessToken);
    }

    const result = verifyJwt(newAccessToken);

    res.locals.user = result.decoded;
  }

  return next();
};

export default deserializeUser;