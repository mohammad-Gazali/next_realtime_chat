import authOptions from "@/lib/auth";
import db from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import fetchRedis from "@/utils/redis";
import toPusherKey from "@/utils/toPusherKey";
import addFriendValidator from "@/utils/validation/add-friend";
import { getServerSession } from "next-auth";
import { z } from "zod";



export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return new Response("Unauthorized", {
				status: 403,
			});
		}

		const body = await req.json();

		const { email: emailToAdd } = addFriendValidator.parse(body.email);

		const RESTresponse = await fetch(
			`${process.env.UPSTASH_REDIS_REST_URL}/get/user:email:${emailToAdd}`,
			{
				headers: {
					Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
				},
				cache: "no-store",
			}
		);

		const data = (await RESTresponse.json()) as { result: string | null };

		const idToAdd = data.result;

		if (!idToAdd) {
			return new Response("This preson does not exist.", {
				status: 404,
			});
		}

		if (idToAdd === session.user.id) {
			return new Response("You can't add yourself as a friend", {
				status: 400,
			});
		}

		// check if user is already added
		const isAlreadyAdded = (await fetchRedis(
			"sismember",
			`user:${idToAdd}:incoming_friend_requests`,
			session.user.id
		)) as 0 | 1;

		if (isAlreadyAdded) {
			return new Response("Already added this user", {
				status: 400,
			});
		}


        // check if user is already friend
		const isAlreadyFriend = (await fetchRedis(
			"sismember",
			`user:${session.user.id}:friends_set`,
			idToAdd
		)) as 0 | 1;

		if (isAlreadyFriend) {
			return new Response("Already friends with this user", {
				status: 400,
			});
		}


		//* valid request state 😀, send friend request, and trigger the related channel by pusherServer

		pusherServer.trigger(
			toPusherKey(`user:${idToAdd}:incoming_friend_requests`),
			"incoming_friend_requests",
			{
				senderId: session.user.id,
				senderEmail: session.user.email,
			}
		)

        db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id);

        return new Response("OK")

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
