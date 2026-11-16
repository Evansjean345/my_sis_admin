import { Chat } from "@shared/features/chat/chat";
import { conversations } from "@shared/features/chat/data";

export default function Page() {
  return <Chat conversations={conversations} />;
}
