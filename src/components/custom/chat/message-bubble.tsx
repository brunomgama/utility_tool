"use client"

import { useMemo } from "react"
import { User, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/types/chat"
import Markdown from "react-markdown"

interface MessageBubbleProps {
    message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === "user"

    const formattedContent = useMemo(() => {
        if (isUser) {
            return message.content
        }

        return (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:mb-1 prose-headings:mt-2">
                <Markdown
                    components={{
                        a: (props) => (
                            <a {...props} target="_blank" rel="noopener noreferrer" />
                        ),
                    }}
                >
                    {message.content}
                </Markdown>
            </div>
        )
    }, [message.content, isUser])

    return (
        <div className="w-full flex">
            <div className={cn("flex items-start gap-2 max-w-[85%]", isUser ? "ml-auto" : "mr-auto")}>
                {!isUser && (
                    <div className="flex-shrink-0 rounded-full h-8 w-8 bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                    </div>
                )}

                <div
                    className={cn(
                        "rounded-lg px-4 py-2 break-words",
                        isUser ? "bg-blue-500 text-white" : "bg-muted text-foreground"
                    )}
                >
                    {typeof formattedContent === "string" ? (
                        <p className="whitespace-pre-wrap">{formattedContent}</p>
                    ) : (
                        formattedContent
                    )}
                </div>

                {isUser && (
                    <div className="flex-shrink-0 rounded-full h-8 w-8 bg-blue-500 flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                    </div>
                )}
            </div>
        </div>
    )
}
