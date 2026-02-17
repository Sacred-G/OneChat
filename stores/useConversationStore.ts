import { create } from "zustand";
import { Item } from "@/lib/assistant";
import { INITIAL_MESSAGE } from "@/config/constants";

interface ConversationState {
  // Items displayed in the chat
  chatMessages: Item[];
  // Items sent to the Responses API
  conversationItems: any[];
  // Whether we are waiting for the assistant response
  isAssistantLoading: boolean;
  selectedSkill: string | null;
  activeConversationId: string | null;
  // Memory context injected from previous conversations (fetched once per new chat)
  memoryContext: string | null;
  // Whether memories have been fetched for this conversation session
  memoriesFetched: boolean;

  setChatMessages: (items: Item[]) => void;
  setConversationItems: (messages: any[]) => void;
  addChatMessage: (item: Item) => void;
  addConversationItem: (message: any) => void;
  setAssistantLoading: (loading: boolean) => void;
  setSelectedSkill: (skill: string | null) => void;
  setActiveConversationId: (id: string | null) => void;
  setMemoryContext: (context: string | null) => void;
  setMemoriesFetched: (fetched: boolean) => void;
  rawSet: (state: any) => void;
  resetConversation: () => void;
  trimHistory: (maxItems?: number) => void;
}

const useConversationStore = create<ConversationState>((set) => ({
  chatMessages: [
    {
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: INITIAL_MESSAGE }],
    },
  ],
  conversationItems: [],
  isAssistantLoading: false,
  selectedSkill: null,
  activeConversationId: null,
  memoryContext: null,
  memoriesFetched: false,
  setChatMessages: (items) => set({ chatMessages: items }),
  setConversationItems: (messages) => set({ conversationItems: messages }),
  addChatMessage: (item) =>
    set((state) => ({ chatMessages: [...state.chatMessages, item] })),
  addConversationItem: (message) =>
    set((state) => ({
      conversationItems: [...state.conversationItems, message],
    })),
  setAssistantLoading: (loading) => set({ isAssistantLoading: loading }),
  setSelectedSkill: (skill) => set({ selectedSkill: skill }),
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setMemoryContext: (context) => set({ memoryContext: context }),
  setMemoriesFetched: (fetched) => set({ memoriesFetched: fetched }),
  rawSet: set,
  resetConversation: () =>
    set(() => ({
      chatMessages: [
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: INITIAL_MESSAGE }],
        },
      ],
      conversationItems: [],
      selectedSkill: null,
      memoryContext: null,
      memoriesFetched: false,
    })),
  trimHistory: (maxItems = 200) =>
    set((state) => {
      const max = Math.max(1, maxItems);
      if (state.conversationItems.length <= max) return state;
      
      // Trim from the beginning, but ensure we don't break function call pairs
      // Keep at least the last max items, but if the cut falls in the middle
      // of a function call/output pair, adjust to include the full pair
      let trimIndex = state.conversationItems.length - max;
      
      // Check if we would cut a function call pair - if so, move trim point forward
      const items = state.conversationItems;
      for (let i = trimIndex; i < Math.min(trimIndex + 2, items.length); i++) {
        const item = items[i];
        // If this is a function_call_output, we need to include its preceding function_call
        if (item?.type === "function_call_output" && item?.call_id) {
          // Find the matching function_call
          for (let j = i - 1; j >= 0; j--) {
            if (items[j]?.type === "function_call" && 
                (items[j]?.call_id === item.call_id || items[j]?.id === item.call_id)) {
              // Move trim index before the function_call
              trimIndex = j;
              break;
            }
          }
        }
      }
      
      const trimmedConversationItems = items.slice(trimIndex);
      
      // Also trim chatMessages to match (roughly same count)
      const chatTrimIndex = Math.max(0, state.chatMessages.length - max);
      const trimmedChatMessages = state.chatMessages.slice(chatTrimIndex);
      
      return {
        chatMessages: trimmedChatMessages,
        conversationItems: trimmedConversationItems,
      } as any;
    }),
}));

export default useConversationStore;
