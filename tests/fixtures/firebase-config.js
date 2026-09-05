export const user = {
  uid: "qa-user",
  displayName: "Marina Costa",
  email: "qa@example.test",
  emailVerified: true,
  reload: async () => {},
};
const scenario = new URLSearchParams(location.search).get("scenario");
if (scenario === "admin") user.email = "admin@example.test";
if (scenario === "unverified") user.emailVerified = false;
export const auth = { currentUser: scenario === "login" ? null : user };
export const db = {};
export const firebaseConfigError = null;
