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



export const logout_user = (setCookie: any) => {
  setCookie("auth_token", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
};
