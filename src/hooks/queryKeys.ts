export const queryKeys = {
  conversations: ['conversations'] as const,
  conversation: (id: string) => ['conversation', id] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  colleagues: ['colleagues'] as const,
  signedUrl: (path: string) => ['signedUrl', path] as const,
};
