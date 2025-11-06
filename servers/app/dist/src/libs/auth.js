"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const prisma_2 = __importDefault(require("./prisma"));
exports.auth = (0, better_auth_1.betterAuth)({
    baseURL: "http://localhost:9000",
    database: (0, prisma_1.prismaAdapter)(prisma_2.default, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        /*
        sendResetPassword: async ({user, url, token}, request) => {
            await sendEmail({
                to: user.email,
                subject: "Reset your password",
                text: `Click the link to reset your password: ${url}`,
            });
        */
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }
    },
    trustedOrigins: ["http://localhost:3000", "http://localhost:9000"],
});
exports.default = exports.auth;
