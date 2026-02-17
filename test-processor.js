// Artillery test processor for dynamic data generation
module.exports = {
  // Generate random user messages for API testing
  generateRandomMessage() {
    const messages = [
      "Hello, how are you?",
      "What's the weather like today?",
      "Can you help me with my homework?",
      "Tell me a joke",
      "What's the capital of France?",
      "Explain quantum computing",
      "Write a poem about nature",
      "Help me debug my code",
      "What are the latest news?",
      "Create a simple React component"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  },

  // Generate random file content for upload testing
  generateFileContent() {
    const size = Math.floor(Math.random() * 10000) + 1000; // 1KB to 10KB
    return 'A'.repeat(size);
  },

  // Random think time to simulate user behavior
  randomThinkTime() {
    return Math.floor(Math.random() * 5) + 1; // 1-5 seconds
  }
};
