import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
createUser,
findUserByEmail,
findUserByEmailOrPhone,
findUserProfileById,
findAllUsersForAdmin,
setUserBlockedStatus,
type NewUserData,
} from "../repositories/userRepository.js";

export class DuplicateEmailError extends Error {
constructor() {
super("An account with this email already exists");
this.name = "DuplicateEmailError";
}
}

export class DuplicatePhoneError extends Error {
constructor() {
super("An account with this phone number already exists");
this.name = "DuplicatePhoneError";
}
}

export class InvalidCredentialsError extends Error {
constructor() {
super("Invalid email or password");
this.name = "InvalidCredentialsError";
}
}

export class UserBlockedError extends Error {
constructor() {
super("Your account has been blocked. Please contact the administrator.");
this.name = "UserBlockedError";
}
}

export class AdminUserNotFoundError extends Error {
constructor() {
super("User not found");
this.name = "AdminUserNotFoundError";
}
}

export class CannotBlockAdminError extends Error {
constructor() {
super("Administrator accounts cannot be blocked through user management");
this.name = "CannotBlockAdminError";
}
}

export async function registerUser(userData: NewUserData) {
const email = userData.email.toLowerCase();
const existingUsers = await findUserByEmailOrPhone(email, userData.phone);

if (existingUsers.some((user) => user.email === email)) {
throw new DuplicateEmailError();
}

if (existingUsers.some((user) => user.phone === userData.phone)) {
throw new DuplicatePhoneError();
}

const hashedPassword = await bcrypt.hash(userData.password, 10);

return createUser({
...userData,
email,
password: hashedPassword,
});
}

export async function loginUser(email: string, password: string) {
const user = await findUserByEmail(email.toLowerCase());

if (!user || !(await bcrypt.compare(password, user.password))) {
throw new InvalidCredentialsError();
}

if (user.isBlocked) {
throw new UserBlockedError();
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
throw new Error("JWT_SECRET is not configured");
}

const token = jwt.sign(
{ sub: String(user.id), role: user.role },
jwtSecret,
{ expiresIn: "1h" },
);

return {
id: user.id,
email: user.email,
phone: user.phone,
role: user.role,
token,
};
}

export async function getUserProfile(userId: number) {
return findUserProfileById(userId);
}

// Admin: list users without exposing their passwords.
export async function getAllUsersForAdmin() {
return findAllUsersForAdmin();
}

// Admin: block or unblock a client account.
export async function changeUserBlockedStatus(
id: number,
isBlocked: boolean,
) {
const user = await findUserProfileForAdmin(id);

if (!user) {
throw new AdminUserNotFoundError();
}

if (user.role === "ADMIN") {
throw new CannotBlockAdminError();
}

return setUserBlockedStatus(id, isBlocked);
}

async function findUserProfileForAdmin(id: number) {
return findUserProfileById(id);
}
