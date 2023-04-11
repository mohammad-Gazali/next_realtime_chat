import { NextAuthOptions } from "next-auth";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import GoogleProvider from "next-auth/providers/google";
import db from "@/lib/db";
import fetchRedis from "@/utils/redis";



function getGoogleCredentials() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || clientId.length === 0) {
        throw new Error("Missing GOOGLE_CLIENT_ID")
    }

    if (!clientSecret || clientSecret.length === 0) {
        throw new Error("Missing GOOGLE_CLIENT_SECRET")
    }

    return {clientId, clientSecret}
}


const authOptions: NextAuthOptions = {
    adapter: UpstashRedisAdapter(db),
    session: {
        strategy: "jwt"
    },
    pages: {
        signIn: "/login"
    },
    providers: [
        GoogleProvider(getGoogleCredentials())
    ],
    callbacks: {
        async jwt({token, user}) {
        
            const dbUserResult = (await fetchRedis("get", `user:${token.id}`)) as string | null;

            if (!dbUserResult) {
                token.id = user.id
                return token
            }

            const dbUser = JSON.parse(dbUserResult);

            return {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                picture: dbUser.image,
            }
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.picture;
            }

            return session
        },
        redirect() {
            return "/dashboard"
        }
    }
}



export default authOptions;