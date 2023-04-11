import authOptions from "@/lib/auth";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { z } from "zod";



export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return new Response("Unauthorized", {
                status: 403
            })
        }

        const body = await req.json();

        const { id: idToDeny } = z.object({ id: z.string() }).parse(body);


        //? here there is no need for validations because if any thing doesn't exist this won't throw an error
        await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToDeny);


        return new Response("Success");
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response("Invalid request payload", {
                status: 422
            })
        }

        return new Response("Invalid request", {
            status: 400
        })
    }
}