"use client"

import type React from "react"

import { useState } from "react"
import {ChevronDown, Loader2, Send} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { ChatMessage } from "@/types/chat"
import MessageBubble from "./message-bubble"
import {useSidebar} from "@/context/sidebar-context";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";

const availableModels = [
    "llama3.2:3b",
    "nomic-embed-text:latest",
    "qwen2.5-coder:1.5b-base",
    "deepseek-r1:14b"
]

export default function ChatInterface() {
    const { isCollapsed } = useSidebar();

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedModel, setSelectedModel] = useState("llama3.2:3b")

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!input.trim()) return

        const userMessage: ChatMessage = {
            role: "user",
            content: input.trim(),
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setIsLoading(true)
        setError(null)

        try {
            const allMessages = [...messages, userMessage]

            const response = await fetch("/api/send-message", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: allMessages,
                }),
            })

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.error || "Failed to get response from AI")
            }

            const assistantMessage = result.data.choices[0].message

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: assistantMessage.content,
                },
            ])
        } catch (err) {
            console.error("Error in chat:", err)
            setError(err instanceof Error ? err.message : "An error occurred while communicating with the AI")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={`transition-all duration-300 ${isCollapsed ? 'ml-[3rem]' : 'ml-[15rem]'} p-6`}>
            <div className="flex justify-between mb-4">
                <div className="flex items-center gap-x-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div
                                className="flex items-center gap-1 cursor-pointer font-semibold text-lg text-muted-foreground hover:text-primary transition-colors">
                                {selectedModel}
                                <ChevronDown className="w-4 h-4"/>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {availableModels.map((model) => (
                                <DropdownMenuItem
                                    key={model}
                                    onClick={() => setSelectedModel(model)}
                                    className={model === selectedModel ? "font-semibold text-primary" : ""}
                                >
                                    {model}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden bg-card">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>Start a conversation with the AI assistant</p>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div key={index} className="flex">
                                <MessageBubble message={message}/>
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            <span>AI is thinking...</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
                            <p className="text-sm font-medium">Error: {error}</p>
                        </div>
                    )}
                </div>

                {/* Input area */}
                <div className="border-t p-4">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message here..."
                            className="flex-1 min-h-[60px] resize-none"
                            disabled={isLoading}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSubmit(e)
                                }
                            }}
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5"/>}
                            <span className="sr-only">Send message</span>
                        </Button>
                    </form>
                    <p className="text-xs text-muted-foreground mt-2">Press Enter to send, Shift+Enter for a new
                        line</p>
                </div>
            </div>
        </div>
    )
}

