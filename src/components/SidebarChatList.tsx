"use client";

import { Message, User } from "@/types/db";
import chatHrefConstructor from "@/utils/chatHrefConstructor";
import { usePathname, useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";



interface SidebarChatListProps {
	friends: User[];
    sessionId: string;
}

const SidebarChatList: FC<SidebarChatListProps> = ({ friends, sessionId }) => {

    const [unseenMessages, setUnseenMessages] = useState<Message[]>([]);

    const router = useRouter();

    const pathname = usePathname();

    useEffect(() => {
        if (pathname?.includes("chat")) {
            setUnseenMessages(preState => preState.filter(message => !pathname.includes(message.senderId)))            
        }
    }, [pathname])

	return (
		<ul role="list" className="max-h-[25rem] overflow-y-auto -mx-2 space-y-1">
			{friends.sort().map((friend) => {
                const unseenMessagesCount = unseenMessages.filter(unseenMessage => {
                    return unseenMessage.senderId === friend.id
                }).length;

				return (
                    <li key={friend.id}>
                        {/* here we use "a" tag instead of "Link" because we want to force a hard refersh after clicking the link to get the latest messages */}
                        <a href={`/dashboard/chat/${chatHrefConstructor(sessionId, friend.id)}`} className="text-gray-700 hover:text-indigo-600 hover:bg-gray-100 group flex items-center gap-3 rounded-md p-2 text-sm leading-6 font-semibold">
                            {friend.name}
                            {unseenMessagesCount > 0 ? (
                                <div className="bg-indigo-600 font-medium text-xs text-white w-4 h-4 flex items-center justify-center rounded-full">
                                    {unseenMessagesCount}
                                </div>
                            ): null}
                        </a>
                    </li>
                );
			})}
		</ul>
	);
};

export default SidebarChatList;
