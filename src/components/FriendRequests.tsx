"use client";

import { pusherClient } from "@/lib/pusher";
import toPusherKey from "@/utils/toPusherKey";
import axios from "axios";
import { Check, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";

interface FriendRequestProps {
	incomingFriendRequests: IncomingFriendRequest[];
	sessionId: string;
}

const FriendRequests: FC<FriendRequestProps> = ({
	incomingFriendRequests,
	sessionId,
}) => {

	const [friendRequests, setFriendRequests] = useState<IncomingFriendRequest[]>(incomingFriendRequests);

	const router = useRouter();

	useEffect(() => {
		pusherClient.subscribe(
			toPusherKey(`user:${sessionId}:incoming_friend_requests`)
		);

		const friendRequestHandler = ({ senderId, senderEmail }: IncomingFriendRequest) => {
			setFriendRequests((preState) => [...preState, { senderId, senderEmail }])
		}

		pusherClient.bind("incoming_friend_requests", friendRequestHandler);


		// "useEffect" cleanup callback
		return () => {
			pusherClient.unsubscribe(
				toPusherKey(`user:${sessionId}:incoming_friend_requests`)
			);
			
			pusherClient.unbind("incoming_friend_requests", friendRequestHandler);
		}
	}, []);

	const acceptFriend = async (senderId: string) => {
		await axios.post("/api/requests/accept", {
			id: senderId,
		});

		setFriendRequests((preState) =>
			preState.filter((request) => request.senderId !== senderId)
		);

		router.refresh();
	};

	const denyFriend = async (senderId: string) => {
        await axios.post("/api/requests/deny", {
			id: senderId,
		});

		setFriendRequests((preState) =>
			preState.filter((request) => request.senderId !== senderId)
		);

		router.refresh();
    };

	return (
		<>
			{friendRequests.length === 0 ? (
				<p className="text-sm text-zinc-500">Nothing to show here....</p>
			) : (
				friendRequests.map((request) => (
					<div key={request.senderId} className="flex gap-4 items-center">
						<UserPlus className="text-black" />
						<p className="font-medium text-lg">{request.senderEmail}</p>
						<button
							onClick={() => acceptFriend(request.senderId)}
							aria-label="accept friend"
							className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center rounded-full transition hover:shadow-md"
						>
							<Check className="font-semibold text-white w-3/4 h-3/4" />
						</button>
						<button
							onClick={() => denyFriend(request.senderId)}
							aria-label="deny friend"
							className="w-8 h-8 bg-red-600 hover:bg-red-700 flex items-center justify-center rounded-full transition hover:shadow-md"
						>
							<X className="font-semibold text-white w-3/4 h-3/4" />
						</button>
					</div>
				))
			)}
		</>
	);
};

export default FriendRequests;
