import authOptions from "@/lib/auth";
import db from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { Message } from "@/types/db";
import fetchRedis from "@/utils/redis";
import toPusherKey from "@/utils/toPusherKey";
import { messageValidator } from "@/utils/validation/message";
import { nanoid } from "nanoid";
import { getServerSession, User } from "next-auth";
import { z } from "zod";



export async function POST(req: Request) {
    try {

        const session = await getServerSession(authOptions);

        if (!session) {
			return new Response("Unauthorized", {
				status: 403,
			});
		}

        const { text, chatId }: { text: string, chatId: string } = await req.json();

        const [userId1, userId2] = chatId.split("----");

        if (session.user.id !== userId1 && session.user.id !== userId2) {
            return new Response("Unauthorized", {
				status: 403,
			});
        }

        const friendId = session.user.id === userId1 ? userId2 : userId1;

        const friendList = await fetchRedis("smembers", `user:${session.user.id}:friends_set`) as string[];

        const isFriend = friendList.includes(friendId)

        if (!isFriend) {
            return new Response("Unauthorized", {
				status: 403,
			});
        }

        const senderResult = await fetchRedis("get", `user:${session.user.id}`) as string;

        const sender = JSON.parse(senderResult) as User;

        //* all valid, let's send the message 🥳, and trigger the related channel by pusherServer

        const timestamp = Date.now();

        const messageData: Message = {
            id: nanoid(),
            senderId: session.user.id,
            receiverId: friendId,
            timestamp,
            text,
        }

        const message = messageValidator.parse(messageData)

        // trigger the related channel
        pusherServer.trigger(
            toPusherKey(`chat:${chatId}`),
            "incoming-message",
            message,
        )

        pusherServer.trigger(
            toPusherKey(`user:${friendId}:chats`),
            "new_message",
            {
                ...message,
                senderImg: sender.image,
                senderName: sender.name
            },
        )


        //? "zadd" like "sadd" but the data type is a sorted set called zset (yes like you heard "sorted set" 🙂 it is like an ordered hash map, read about it in https://redis.io/docs/data-types/tutorial/#sorted-sets)
        await db.zadd(`chat:${chatId}:messages`, {
            score: timestamp,
            member: JSON.stringify(message)
        })

        return new Response("OK");

    } catch (error) {
        if (error instanceof Error) {
            return new Response(error.message, {
                status: 500
            })
        }

        if (error instanceof z.ZodError) {
            return new Response("Invalid Payload", {
                status: 400
            })
        }

        return new Response("Internal Server Error", {
            status: 500
        })
    }
}