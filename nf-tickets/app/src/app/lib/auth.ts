import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import db from "@/app/db";
import { Session } from "next-auth";

export interface session extends Session {
  user: {
    email: string;
    name: string;
    image: string;
    uid: string;
  };
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    session: ({ session, token }: any): session => {
      const newSession: session = session as session;
      if (newSession.user && token.uid) {
        // @ts-ignore
        newSession.user.uid = token.uid ?? "";
      }
      return newSession!;
    },
    async jwt({ token, account, profile }: any) {
      if (account?.provider === "google") {
        const user = await db.user.findUnique({
          where: {
            email: token.email,
          },
        });
        if (user) {
          token.uid = user.id;
          token.walletAddress = user.walletAddress;
        }
      }
      return token;
    },
    async signIn({ user, account, profile }: any) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) {
          return false;
        }

        let dbUser = await db.user.findUnique({
          where: {
            email: email,
          },
        });

        if (!dbUser) {
          dbUser = await db.user.create({
            data: {
              username: email.split("@")[0], // Using part of email as username
              email: email,
            },
          });
        }

        return true;
      }

      return false;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
