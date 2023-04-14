"use client";

import { pusherClient } from "@/lib/pusher";
import toPusherKey from "@/utils/toPusherKey";
import { User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";




const FriendRequestsSidebarOption = ({ initialUnseenRequestCount, sessionId }: { initialUnseenRequestCount: number, sessionId: string }) => {

    const [unseenRequestCount, setUnseenRequestCount] = useState(initialUnseenRequestCount);

    
	useEffect(() => {
		pusherClient.subscribe(
			toPusherKey(`user:${sessionId}:incoming_friend_requests`)
		);

		const friendRequestHandler = () => {
			setUnseenRequestCount(preState => preState + 1)
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

    return (
        <Link href="/dashboard/requests" className="text-gray-700 hover:text-indigo-600 hover:bg-gray-100 group flex items-center gap-3 rounded-md p-2 text-sm leading-6 font-semibold">
            <div className="text-gray-400 border-gray-100 group-hover:border-indigo-600 group-hover:text-indigo-600 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white">
                <User className="w-4 h-4" />
            </div>
            <p className="truncate">Friend requests</p>
            {unseenRequestCount > 0 ? (
                <div className="rounded-full w-5 h-5 text-xs flex items-center justify-center text-white bg-indigo-600">
                    {unseenRequestCount}
                </div>
            ): null}
        </Link>
    )
}

export default FriendRequestsSidebarOption