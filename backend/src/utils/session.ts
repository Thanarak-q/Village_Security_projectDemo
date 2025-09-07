/**
 * Logs in a user by creating a JWT and setting it as a cookie.
 * @param {any} user - The user object.
 * @param {any} jwt - The JWT object.
 * @param {any} set - The set object.
 * @returns {Promise<void>}
 */
export const login_user = async (user: any, jwt: any, set: any) => {
  const token = await jwt.sign({
    id: user.admin_id,
    name: user.username,
    role: user.role,
  });

  set.cookie("auth_token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
};

/**
 * Logs out a user by clearing the auth token cookie.
 * @param {any} setCookie - The setCookie function.
 * @returns {void}
 */
export const logout_user = (setCookie: any) => {
  setCookie("auth_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
};
