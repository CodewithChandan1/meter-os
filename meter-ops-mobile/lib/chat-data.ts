export type ChatMessage = {
  id: string;
  senderName: string;
  receiverName: string;
  text: string;
  timestamp: string;
  meterId?: string;
};

export const initialMessages: ChatMessage[] = [];
