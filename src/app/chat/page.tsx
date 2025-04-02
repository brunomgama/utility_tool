import ChatInterface from "@/components/custom/chat/chat-interface";
import {validate_user} from "@/lib/validate_user";
import MessageLoading from "@/components/custom/spinner/Loading";

export default async function ChatPage() {
    const session = await validate_user();

    if(!session) { return ( <MessageLoading/> ); }

    return <ChatInterface />;
}