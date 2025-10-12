

import { authClient } from "@/lib/auth-client";

export interface IUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
}

export class User {
  private static sampleUser: IUser = {
    id: "123",
    full_name: "John Doe",
    email: "john.doe@example.com",
    avatar_url: null, 
  };

  
  static async me(): Promise<IUser> {
    try {
      const { data, error } = await authClient.getSession();

      if (error) {
        const authError: any = new Error(error.message ?? "Unable to validate session");
        authError.status = error.status ?? 500;
        throw authError;
      }

      const user = data?.user;
      if (!user) {
        const unauthenticated: any = new Error("No active session");
        unauthenticated.status = 401;
        throw unauthenticated;
      }

      return {
        id: user.id,
        full_name: user.name,
        email: user.email,
        avatar_url: user.image ?? null,
      };
    } catch (err: any) {
      if (err?.status) {
        throw err;
      }

      const wrapped: any = new Error("Failed to validate user session");
      wrapped.cause = err;
      throw wrapped;
    }
  }

  
  static async logout(): Promise<void> {
    const { error } = await authClient.signOut();
    if (error) {
      throw new Error(error.message ?? "Unable to sign out");
    }
  }


  static async updateMyUserData(data) {
    return new Promise((resolve) => {
      User.sampleUser = { ...User.sampleUser, ...data };
    });
  }
}

