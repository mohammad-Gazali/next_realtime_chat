import authOptions from "@/lib/auth";
import { Message } from "@/types/db";
import chatHrefConstructor from "@/utils/chatHrefConstructor";
import getFriendsByUserId from "@/utils/getUserFriends";
import fetchRedis from "@/utils/redis";
import { ChevronRight } from "lucide-react";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const page = async () => {
	const session = await getServerSession(authOptions);

	if (!session) notFound();

	const friends = await getFriendsByUserId(session.user.id);

	const friendsWithLastMessage = await Promise.all(
		friends.map(async (friend) => {
			//? here we will take the first item from the sorted set by this destructuring
			const [lastMessageResult] = await fetchRedis(
				"zrange",
				`chat:${chatHrefConstructor(session.user.id, friend.id)}:messages`,
				0,
				-1
			);

			const lastMessage = lastMessageResult ? JSON.parse(lastMessageResult) as Message : null;

			if (lastMessage) {
				return {
					...friend,
					lastMessage,
				}
			}

			return null

		})
	);

	return (
		<div className="container mx-6 py-12">
			<h1 className="font-bold text-5xl mb-8">Recent chats</h1>
			{friendsWithLastMessage.length === 0 || friendsWithLastMessage.some(friend => friend === null) ? (
				<p className="text-sm text-zinc-500">Nothing to show here...</p>
			) : (
				friendsWithLastMessage.map((friend) => (
					<div
						key={friend!.id}
						className="relative bg-zinc-50 border border-zinc-200 p-3 rounded-md max-w-xs"
					>
						<div className="absolute right-4 inset-y-0 flex items-center">
							<ChevronRight className="h-7 w-7 text-zinc-400" />
						</div>
						<Link
							href={`/dashboard/chat/${chatHrefConstructor(
								session.user.id,
								friend!.id
							)}`}
							className="relative sm:flex"
						>
							<div className="sm:mb-0 sm:mr-4 mb-4 flex-shrink-0">
								<div className="relative h-6 w-6">
									<Image
										referrerPolicy="no-referrer"
										className="rounded-full object-cover"
										width={40}
										height={40}
										src={friend!.image}
										alt={`${friend!.name} profile picture`}
									/>
								</div>
							</div>
							<div>
								<h4 className="text-lg font-semibold">{friend!.name}</h4>
								<p className="mt-1 max-w-md">
									<span className="text-zinc-400 mr-2">
										{friend!.lastMessage?.senderId === session.user.id // you sended the last message
											? "You:"
											: ""}
									</span>
									{friend!.lastMessage?.text}
								</p>
							</div>
						</Link>
					</div>
				))
			)}
		</div>
	);
};

export default page;
