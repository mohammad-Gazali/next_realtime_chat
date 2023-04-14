import { FriendRequestsSidebarOption, Icons, SignOutButton, SidebarChatList } from "@/components";
import MoblieChatLayout from "@/components/MoblieChatLayout";
import authOptions from "@/lib/auth";
import { SidebarOption } from "@/types/typings";
import getFriendsByUserId from "@/utils/getUserFriends";
import fetchRedis from "@/utils/redis";
import { getServerSession, User } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";



interface LayoutProps {
	children: ReactNode;
}

const sidebarOptions: SidebarOption[] = [
	{
		id: 1,
		name: "Add frined",
		href: "/dashboard/add",
		icon: <Icons.UserPlus className="w-4 h-4" />,
	},
];

const Layout = async ({ children }: LayoutProps) => {
	const session = await getServerSession(authOptions);

	if (!session) notFound();

	const friends = await getFriendsByUserId(session.user.id);

    const unseenRequestCount = (await fetchRedis(
                'smembers',
                `user:${session.user.id}:incoming_friend_requests`
            ) as User[]
        ).length;

	return (
		<div className="w-full flex h-screen">
			<div className="md:hidden ">
				<MoblieChatLayout session={session} friends={friends} unseenRequestCount={unseenRequestCount} sidebarOptions={sidebarOptions} />
			</div>
			<aside className="md:flex hidden h-full w-full max-w-xs grow flex-col gap-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
				<Link
					className="flex h-16 shrink-0 items-center text-indigo-600"
					href="/dashboard"
				>
					{Icons.appLogo}
				</Link>
				<nav className="flex flex-1 flex-col">
					<ul role="list" className="flex flex-1 flex-col gap-7">
						{friends.length > 0 ? (
							<li>
								<div className="text-xs font-semibold leading-6 text-gray-400">
									Your chats
								</div>	
								<SidebarChatList sessionId={session.user.id} friends={friends} />
							</li>
						) : null}
						<li>
							<div className="text-xs font-semibold leading-6 text-gray-400">
								Overview
							</div>
							<ul role="list" className="-mx-2 mt-2 space-y-1">
								{sidebarOptions.map((option) => {
									return (
										<li key={option.id}>
											<Link
												className="text-gray-700 hover:text-indigo-600 hover:bg-gray-100 group flex gap-3 rounded-md p-2 text-sm leading-6 font-semibold"
												href={option.href}
											>
												<span className="text-gray-400 border border-gray-100 group-hover:border-indigo-600 group-hover:text-indigo-600 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[0.625rem] font-medium bg-white">
													{option.icon}
												</span>
												<span className="truncate">{option.name}</span>
											</Link>
										</li>
									);
								})}
								<li>
									<FriendRequestsSidebarOption sessionId={session.user.id} initialUnseenRequestCount={unseenRequestCount} />
								</li>
							</ul>
						</li>
						<li className="-mx-6 mt-auto flex items-center">
							<div className="flex flex-1 items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900">
								<div className="relative h-8 w-8 bg-gray-50">
									<Image
										referrerPolicy="no-referrer"
										className="rounded-full object-cover"
                                        width={50}
                                        height={50}
										src={session.user.image || ""}
										alt="Your Profile Picture"
									/>
								</div>
								<span className="sr-only">Your Profile</span>
								<div className="flex flex-col">
									<span aria-hidden="true">{session.user.name}</span>
									<span className="text-xs text-zinc-400" aria-hidden="true">
										{session.user.email}
									</span>
								</div>
							</div>
                            <SignOutButton className="h-full aspect-square" />
						</li>
					</ul>
				</nav>
			</aside>
			{children}
		</div>
	);
};

export default Layout;
