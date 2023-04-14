"use client";

import { pusherClient } from "@/lib/pusher";
import { Message, User } from "@/types/db";
import cn from "@/utils/cn";
import toPusherKey from "@/utils/toPusherKey";
import { format } from "date-fns";
import Image from "next/image";
import { FC, useEffect, useRef, useState } from "react";

interface MessagesProps {
	initialMessages: Message[];
	sessionId: string;
    sessionImg: string | null | undefined;
	chatId: string;
    chatPartner: User;
}

const Messages: FC<MessagesProps> = ({ initialMessages, sessionId, sessionImg, chatPartner, chatId }) => {
	const [messages, setMessages] = useState<Message[]>(initialMessages);

	useEffect(() => {
		pusherClient.subscribe(
			toPusherKey(`chat:${chatId}`)
		);

		const messageHandler = (message: Message) => {
			setMessages((preState) => [message, ...preState])
		}

		pusherClient.bind("incoming-message", messageHandler);


		// "useEffect" cleanup callback
		return () => {
			pusherClient.unsubscribe(
				toPusherKey(`chat:${chatId}`)
			);
			
			pusherClient.unbind("incoming-message", messageHandler);
		}
	}, []);

	const scrollDownRef = useRef<HTMLDivElement>(null);

	const formatTimeStamp = (timestamp: number) => {
		return format(timestamp, "HH:mm");
	};

	return (
		<div className="flex flex-col-reverse h-full flex-1 gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch">
			<div ref={scrollDownRef} />
			{messages.map((message, index) => {
				const isCurrentUser = message.senderId == sessionId;

				const hasNextMessageFromSameUser =
					messages[index - 1]?.senderId === messages[index]?.senderId;

				return (
					<div key={message.id}>
						<div
							className={cn("flex items-end", { "justify-end": isCurrentUser })}
						>
							<div
								className={cn("flex flex-col gap-2 text-base max-w-xs mx-2", {
									"order-1 items-end": isCurrentUser,
									"order-2 items-start": !isCurrentUser,
								})}
							>
								<span
									className={cn("px-4 py-2 rounded-lg inline-block", {
										"bg-indigo-600 text-white": isCurrentUser,
										"bg-gray-200 text-gray-900": !isCurrentUser,
										"rounded-br-none":
											!hasNextMessageFromSameUser && isCurrentUser,
										"rounded-bl-none":
											!hasNextMessageFromSameUser && !isCurrentUser,
									})}
								>
									{message.text}{" "}
									<span className="ml-2 text-xs text-gray-400">
										{formatTimeStamp(message.timestamp)}
									</span>
								</span>
							</div>
							<div
								className={cn("relative w-6 h-6", {
									"order-2": isCurrentUser,
									"order-1": !isCurrentUser,
									invisible: hasNextMessageFromSameUser,
								})}
							>
								<Image
									src={
										isCurrentUser ? (sessionImg as string) : chatPartner.image
									}
                                    className="rounded-full object-cover"
                                    width={30}
                                    height={30}
									alt="Profile picture"
									referrerPolicy="no-referrer"
								/>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
};

export default Messages;
