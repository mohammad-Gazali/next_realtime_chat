import { FriendRequests } from "@/components";
import authOptions from "@/lib/auth";
import fetchRedis from "@/utils/redis";
import { getServerSession, User } from "next-auth";
import { notFound } from "next/navigation";



const page = async () => {
    const session = await getServerSession(authOptions);

    if (!session) notFound();

    // ids of people who sent current logged in user friend requests
    const incomingSenderIds = (await fetchRedis(
        "smembers",
        `user:${session.user.id}:incoming_friend_requests`,
    )) as string[];


    const incomingFriendRequests = await Promise.all(
        incomingSenderIds.map(async (senderId) => {
            const sender = (await fetchRedis("get", `user:${senderId}`)) as string;
            const senderParsed = JSON.parse(sender) as User;
            return {
                senderId,
                senderEmail: senderParsed.email,
            }
        })
    );

	return (
        <main className="pt-8 ml-6">
            <h1 className="font-bold text-5xl mb-8">
                Friend Requests
            </h1>
            <div className="flex flex-col gap-4">
                <FriendRequests incomingFriendRequests={incomingFriendRequests} sessionId={session.user.id} />
            </div>
        </main>
    );
};

export default page;
