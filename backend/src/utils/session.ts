/**
 * @file This file contains utility functions for managing user sessions,
 * including logging in and logging out. It abstracts the logic for handling
 * JSON Web Tokens (JWT) and setting secure cookies, providing a simple
 * interface for session control within the application.
 */

/**
 * Creates a JWT for a given user and sets it as an `auth_token` cookie.
 * This function is central to establishing an authenticated session for a user.
 * The cookie is configured to be `HttpOnly` for security.
 *
 * @param {any} user - The user object, which must contain `admin_id`, `username`, and `role`.
 * @param {any} jwt - The JWT service object, used for signing the token.
 * @param {any} set - The response context object, used to set the cookie.
 * @returns {Promise<void>} A promise that resolves once the token is signed and the cookie is set.
 */
export const login_user = async (user: any, jwt: any, set: any): Promise<void> => {
  const token = await jwt.sign({
    id: user.admin_id,
    name: user.username,
    role: user.role,
  });

  set.cookie("auth_token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
};

/**
 * Logs out a user by clearing the `auth_token` cookie.
 * This is achieved by setting the cookie's expiration date to a past value,
 * which instructs the browser to remove it.
 *
 * @param {any} setCookie - The function provided by the framework to set a cookie.
 * @returns {void}
 */
export const logout_user = (setCookie: any): void => {
  setCookie("auth_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
};
