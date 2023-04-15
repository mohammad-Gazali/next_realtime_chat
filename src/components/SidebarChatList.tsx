"use client";

import { pusherClient } from "@/lib/pusher";
import { Message, User } from "@/types/db";
import chatHrefConstructor from "@/utils/chatHrefConstructor";
import toPusherKey from "@/utils/toPusherKey";
import { usePathname } from "next/navigation";
import { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import UnseenMessageToast from "./UnseenMessageToast";

interface SidebarChatListProps {
	friends: User[];
	sessionId: string;
}

interface ExtendedMessage extends Message {
	senderImg: string;
	senderName: string;
}

const SidebarChatList: FC<SidebarChatListProps> = ({ friends, sessionId }) => {
	
	const [unseenMessages, setUnseenMessages] = useState<Message[]>([]);
	const [activeChats, setActiveChats] = useState<User[]>(friends);

	const pathname = usePathname();

	useEffect(() => {
		if (pathname?.includes("chat")) {
			setUnseenMessages((preState) =>
				preState.filter((message) => !pathname.includes(message.senderId))
			);
		}

		// subscribe to channel for toast notification
		//? we put the subscribe in this component because we want the notification to be shown for every page, and this component is included in the main layout so it is the best choice for this task

		pusherClient.subscribe(toPusherKey(`user:${sessionId}:chats`));
		pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends_set`));

		const chatHandler = (data: ExtendedMessage) => {
			//? here we check if we should make a notify, namely, if we in the chat then why we would make a notify 🙂
			const shouldNotify =
				pathname !==
				`/dashboard/chat/${chatHrefConstructor(sessionId, data.senderId)}`;

			if (shouldNotify) {
				toast.custom((t) => (
					<UnseenMessageToast
						t={t}
						sessionId={sessionId}
						senderImg={data.senderImg}
						senderName={data.senderName}
						senderId={data.senderId}
						senderMessage={data.text}
					/>
				));

                setUnseenMessages(preState => [...preState, data])
			}
		};

		const newFriendHandler = (newFriend: User) => {
			setActiveChats(preState => [...preState, newFriend])
		};

		pusherClient.bind("new_message", chatHandler);
		pusherClient.bind("new_friend", newFriendHandler);

		return () => {
			pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:chats`));
			pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:friends_set`));

			pusherClient.unbind("new_message", chatHandler);
			pusherClient.unbind("new_friend", newFriendHandler);
		};

	}, [pathname, sessionId]);

	return (
		<ul role="list" className="max-h-[25rem] overflow-y-auto -mx-2 space-y-1">
			{activeChats.sort().map((friend) => {
				const unseenMessagesCount = unseenMessages.filter((unseenMessage) => {
					return unseenMessage.senderId === friend.id;
				}).length;

				return (
					<li key={friend.id}>
						{/* here we use "a" tag instead of "Link" because we want to force a hard refersh after clicking the link to get the latest messages */}
						<a
							href={`/dashboard/chat/${chatHrefConstructor(
								sessionId,
								friend.id
							)}`}
							className="text-gray-700 hover:text-indigo-600 hover:bg-gray-100 group flex items-center gap-3 rounded-md p-2 text-sm leading-6 font-semibold"
						>
							{friend.name}
							{unseenMessagesCount > 0 ? (
								<div className="bg-indigo-600 font-medium text-xs text-white w-4 h-4 flex items-center justify-center rounded-full">
									{unseenMessagesCount}
								</div>
							) : null}
						</a>
					</li>
				);
			})}
		</ul>
	);
};

export default SidebarChatList;
