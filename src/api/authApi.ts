const USER_KEY = "deedlockhomes_auth_user_v1";

export interface MockUser {
  name: string;
  email: string;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getStoredUser(): MockUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

export async function signupMock(name: string, email: string): Promise<MockUser> {
  await delay(800);
  const user = { name, email };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export async function loginMock(email: string): Promise<MockUser> {
  await delay(700);
  const existingUser = getStoredUser();
  if (existingUser && existingUser.email === email) return existingUser;

  const fallback = {
    name: "Demo User",
    email,
  };
  localStorage.setItem(USER_KEY, JSON.stringify(fallback));
  return fallback;
}

export function logoutMock() {
  localStorage.removeItem(USER_KEY);
}
