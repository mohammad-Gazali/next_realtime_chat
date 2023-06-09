"use client";

import { User } from "@/types/db";
import { FC, useRef, useState } from "react";
import TextAreaAutozise from "react-textarea-autosize";
import { Button } from "@/components/ui";
import axios from "axios";
import { toast } from "react-hot-toast";



interface ChatInputProps {
    chatPartner: User;
    chatId: string
}

const ChatInput: FC<ChatInputProps> = ({ chatPartner, chatId }) => {

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const sendMessage = async () => {
        if (input) {
            setIsLoading(true);
            try {
                
                await axios.post("/api/message/send", {
                    text: input,
                    chatId
                })
                
                setInput("");
                
                textareaRef.current?.focus();
    
            } catch {
                
                toast.error("Something went wrong. Please try again later.")
    
            } finally {
                setIsLoading(false);
            }
            
        } else {
            toast.error("The message can't be empty.")
        }
    };

	return (
		<div className="border-t border-gray-200 px-4 pt-4 sm:mb-0 mb-2">
			<div className="relative overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
				<TextAreaAutozise
					ref={textareaRef}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							sendMessage();
						}
					}}
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`Message ${chatPartner.name}`}
                    className="block w-full resize-none border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:py-1.5 sm:text-sm sm:leading-6"
				/>
                <div onClick={() => textareaRef.current?.focus()} className="py-2 cursor-text" aria-hidden="true">
                    <div className="py-px">
                        <div className="h-9"/>
                    </div>
                </div>
                <div className="absolute right-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
                    <div className="shrink-0">
                        <Button isLoading={isLoading} onClick={sendMessage} type="submit">
                            Post
                        </Button>
                    </div>
                </div>
			</div>
		</div>
	);
};

export default ChatInput;
