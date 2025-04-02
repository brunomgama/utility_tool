export interface ChatMessage {
    role: "user" | "assistant" | "system"
    content: string
}

export interface ChatRequest {
    model: string
    messages: ChatMessage[]
}

export interface ChatResponse {
    id: string
    object: string
    created: number
    model: string
    system_fingerprint: string
    choices: {
        index: number
        message: {
            role: string
            content: string
        }
        finish_reason: string
    }[]
    usage: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
    }
}

