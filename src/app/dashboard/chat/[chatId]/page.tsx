import { ChatInput, Messages } from "@/components";
import authOptions from "@/lib/auth";
import { Message, User } from "@/types/db";
import fetchRedis from "@/utils/redis";
import { messageArrayValidator } from "@/utils/validation/message";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { notFound } from "next/navigation";



const getChatMessages = async (chatId: string) => {
  try {
    const results: string[] = await fetchRedis(
      "zrange",  //? zrange is a sorted array (normal array 🙂)
      `chat:${chatId}:messages`,
      0,  //? this is the start index we want to fetch from the zrange
      -1  //? this is the end index we want to fetch from the zrange
    )

    const dbMessages = results.map(message => JSON.parse(message) as Message)

    const reversedDbMessages = dbMessages.reverse();

    const messages = messageArrayValidator.parse(reversedDbMessages);

    return messages
  } catch (error) {
    notFound();
  }
}


const page = async ({ params }: { params: { chatId: string } }) => {

  const { chatId } = params;

  const session = await getServerSession(authOptions);

  if (!session) notFound();

  const { user } = session;

  const [userId1, userId2] = chatId.split("----");

  if (user.id !== userId1 && user.id !== userId2) notFound();
  
  const chatPartnerId = user.id === userId1 ? userId2 : userId1;

  const chatPartnerResult = await fetchRedis("get", `user:${chatPartnerId}`) as string | null;

  if (!chatPartnerResult) notFound();

  const chatPartner = JSON.parse(chatPartnerResult) as User;

  const initialMessages = await getChatMessages(chatId);

  return (
    <div className="flex-1 flex flex-col justify-between h-full max-h-[calc(100vh-6rem)]">
      <div className="flex sm:items-center justify-between py-3 border-b-2 border-gray-200 z-20">
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="relative sm:w-12 w-8 sm:h-12 h-8 ml-2">
              <Image
              referrerPolicy="no-referrer"
              className="rounded-full object-cover"
              width={40}
              height={40}
              src={chatPartner.image}
              alt={`${chatPartner.name} profile picture`}
              />
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <div className="text-xl flex items-center">
              <span className="text-gray-700 mr-3 font-semibold">{chatPartner.name}</span>
            </div>
            <span className="text-sm text-gray-600">{chatPartner.email}</span>
          </div>
        </div>
      </div>
      <Messages chatId={chatId} chatPartner={chatPartner} sessionImg={session.user.image} initialMessages={initialMessages} sessionId={session.user.id} />
      <ChatInput chatPartner={chatPartner} chatId={chatId} />
    </div>
  )
}

export default page