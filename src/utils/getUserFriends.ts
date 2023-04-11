import { User } from "@/types/db";
import fetchRedis from "./redis";

export default async function getFriendsByUserId(userId: string) {
    const friendsIds = await fetchRedis("smembers", `user:${userId}:friends_set`) as string[];

    const friends = await Promise.all(
        friendsIds.map(async (friendId) => {
            const friendResult = await fetchRedis("get", `user:${friendId}`) as string;

            const friend = JSON.parse(friendResult) as User;

            return friend
        })
    )

    return friends
}