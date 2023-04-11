import authOptions from "@/lib/auth";
import db from "@/lib/db";
import fetchRedis from "@/utils/redis";
import { getServerSession } from "next-auth";
import { z } from "zod";



export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return new Response("Unauthorized", {
                status: 403
            })
        }

        const body = await req.json();

        const { id: idToAccept } = z.object({ id: z.string() }).parse(body);

        // verify both users are not already friends
        const isAlreadyFriends = await fetchRedis(
            "sismember",
            `user:${session.user.id}:friends`,
            idToAccept
        )

        if (isAlreadyFriends) {
            return new Response("Already friends", {
                status: 400
            })
        }

        const hasFriendRequest = await fetchRedis(
            "sismember",
            `user:${session.user.id}:incoming_friend_requests`,
            idToAccept
        )

        if (!hasFriendRequest) {
            return new Response("No friend request", {
                status: 400
            })
        }

        //? add the id to db
        //? here we didn't use fetch "fetchRedis" because no cache behavior we could be afrid of, this because we set a new key (or edit its value) in the database
        //? "sadd" method make a key if it doesn't exist and add a set with the value we added, and if the key exist before then we add the new value to the set, and it return an error only if there is already the same key with value of type non-set
        await db.sadd(`user:${session.user.id}:friends_set`, idToAccept);  //* add him as a friend to me
        await db.sadd(`user:${idToAccept}:friends_set`, session.user.id);  //* add me as a frined to him

        //? "srem" is like "sadd" except it removes not adds
        await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAccept);  //* remove his request from the db, because we added him as a friend to the current user
        await db.srem(`user:${idToAccept}:incoming_friend_requests`, session.user.id);  //* remove my request (if it exists) from the db, because we added him as a friend to the current user

        return new Response("Success");
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response("Invalid request payload", {
                status: 422
            })
        }

        return new Response("Invalid request", {
            status: 400
        })
    }
}