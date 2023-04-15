import authOptions from "@/lib/auth";
import db from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { User } from "@/types/db";
import fetchRedis from "@/utils/redis";
import toPusherKey from "@/utils/toPusherKey";
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
            `user:${session.user.id}:friends_set`,
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

        const [userResult, friendResult] = (await Promise.all([
            fetchRedis("get", `user:${session.user.id}`),
            fetchRedis("get", `user:${idToAccept}`),
        ])) as string[]


        const user = JSON.parse(userResult) as User;
        const friend = JSON.parse(friendResult) as User;

        
        await Promise.all([
            pusherServer.trigger(toPusherKey(`user:${idToAccept}:friends_set`), "new_friend", user),
            pusherServer.trigger(toPusherKey(`user:${session.user.id}:friends_set`), "new_friend", friend),
            db.sadd(`user:${session.user.id}:friends_set`, idToAccept),
            db.sadd(`user:${idToAccept}:friends_set`, session.user.id),  
            db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAccept),
            db.srem(`user:${idToAccept}:incoming_friend_requests`, session.user.id),
        ])
        
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