"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Sparkles,
  Minimize2,
  Maximize2,
  Trash2,
  Maximize
} from "lucide-react";
import { cn } from "@/lib/utils";
import { storage, ChatMessage } from "@/lib/storage";
import { generateChatResponse } from "@/lib/gemini";

interface ChatbotProps {
  userRole: string | null;
  shipments?: any[];
  disruptions?: any[];
  isOpen?: boolean;
  onClose?: () => void;
  autoOpenWithContext?: {
    message: string;
    context?: any;
  };
}

export function Chatbot({ 
  userRole, 
  shipments = [], 
  disruptions = [], 
  isOpen: externalIsOpen,
  onClose,
  autoOpenWithContext 
}: ChatbotProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOpen = externalIsOpen ?? false;

  // Auto-open with context
  useEffect(() => {
    if (autoOpenWithContext && onClose) {
      // Parent controls open state, just set the input
      setInput(autoOpenWithContext.message);
      // Auto-send after a brief delay
      setTimeout(() => {
        handleSend();
      }, 500);
    }
  }, [autoOpenWithContext]);

  // Load chat history on mount
  useEffect(() => {
    const history = storage.getChatHistory();
    if (history.length > 0) {
      setMessages(history);
    } else {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: `👋 Welcome to Flexify!\n\nI'm your intelligent supply chain assistant, built right into FlexMove. I can help you:\n\n✈️ Track and manage shipments\n⚠️ Resolve disruptions instantly\n📊 Understand your analytics\n🌍 Optimize routes and costs\n🌱 Improve sustainability\n\nWhat would you like to know?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // Update storage when shipments or disruptions change
  useEffect(() => {
    if (shipments.length > 0) {
      storage.update("shipments", shipments);
    }
    if (disruptions.length > 0) {
      storage.update("disruptions", disruptions);
    }
  }, [shipments, disruptions]);

  // Update user role in storage
  useEffect(() => {
    storage.update("userRole", userRole);
  }, [userRole]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Format message content to handle markdown-style formatting
  const formatMessageContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        // Clean up escaped characters
        let formattedLine = line
          .replace(/\\\$/g, '$')        // Remove backslash from \$
          .replace(/\\\*/g, '*')        // Remove backslash from \*
          .replace(/\\\|/g, '|')        // Remove backslash from \|
          .replace(/\\\//g, '/')        // Remove backslash from \/
          .replace(/\\"/g, '"')         // Remove backslash from \"
          .replace(/\\'/g, "'");        // Remove backslash from \'
        
        // Handle bold text **text**
        const boldRegex = /\*\*(.+?)\*\*/g;
        const parts: (string | JSX.Element)[] = [];
        let lastIndex = 0;
        let match;
        
        while ((match = boldRegex.exec(formattedLine)) !== null) {
          // Add text before bold
          if (match.index > lastIndex) {
            parts.push(formattedLine.substring(lastIndex, match.index));
          }
          // Add bold text
          parts.push(
            <strong key={`bold-${i}-${match.index}`} className="font-bold">
              {match[1]}
            </strong>
          );
          lastIndex = match.index + match[0].length;
        }
        
        // Add remaining text
        if (lastIndex < formattedLine.length) {
          parts.push(formattedLine.substring(lastIndex));
        }
        
        // If no bold text was found, just use the cleaned line
        const content = parts.length > 0 ? parts : formattedLine;
        
        return (
          <div key={i} className="leading-relaxed">
            {content || <br />}
          </div>
        );
      });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    // Extract entities from user message
    const entities = storage.extractEntities(input.trim());
    
    // Update conversation context
    const shipmentMatch = input.match(/SH\d+/gi);
    if (shipmentMatch && shipmentMatch.length > 0) {
      storage.updateConversationContext({ 
        lastShipmentId: shipmentMatch[0],
        entities: [...new Set([...storage.getConversationContext().entities, ...entities])]
      });
    }
    
    // Detect topic
    if (input.toLowerCase().includes('delivery') || input.toLowerCase().includes('deliver')) {
      storage.updateConversationContext({ lastTopic: 'delivery' });
    } else if (input.toLowerCase().includes('disruption') || input.toLowerCase().includes('delay')) {
      storage.updateConversationContext({ lastTopic: 'disruption' });
    } else if (input.toLowerCase().includes('cost') || input.toLowerCase().includes('price')) {
      storage.updateConversationContext({ lastTopic: 'cost' });
    }

    setMessages(prev => [...prev, userMessage]);
    storage.addChatMessage(userMessage);
    setInput("");
    setIsLoading(true);

    try {
      // Get context from storage
      const context = storage.getContextForGemini(userRole);
      
      // Generate response
      const response = await generateChatResponse(input.trim(), context);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      storage.addChatMessage(assistantMessage);
      
      // Generate follow-up suggestions
      generateFollowUpSuggestions(input.trim(), response);
    } catch (error) {
      console.error("Chat error:", error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "⚠️ I'm having trouble connecting right now. Please make sure your Gemini API key is configured in the .env.local file. You can add it like this:\n\n```\nNEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here\n```\n\nThen restart the development server.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const generateFollowUpSuggestions = (userQuestion: string, aiResponse: string) => {
    const suggestions: string[] = [];
    const lowerQuestion = userQuestion.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();
    
    // Extract shipment IDs from question and response
    const shipmentIds = [...userQuestion.matchAll(/SH\d+/gi), ...aiResponse.matchAll(/SH\d+/gi)]
      .map(match => match[0])
      .filter((v, i, a) => a.indexOf(v) === i);
    
    // Topic-based suggestions
    if (lowerQuestion.includes('status') || lowerResponse.includes('status')) {
      if (shipmentIds.length > 0) {
        suggestions.push(`What's the ETA for ${shipmentIds[0]}?`);
        suggestions.push(`Show route details for ${shipmentIds[0]}`);
      }
      suggestions.push("Are there any delays?");
    }
    
    if (lowerQuestion.includes('delivery') || lowerQuestion.includes('eta')) {
      suggestions.push("What's causing any delays?");
      suggestions.push("Show me alternative routes");
      if (shipmentIds.length > 0) {
        suggestions.push(`Track ${shipmentIds[0]} in real-time`);
      }
    }
    
    if (lowerQuestion.includes('cost') || lowerResponse.includes('cost')) {
      suggestions.push("How can I reduce shipping costs?");
      suggestions.push("Compare costs across carriers");
      suggestions.push("Show cost breakdown");
    }
    
    if (lowerQuestion.includes('carbon') || lowerQuestion.includes('sustainability') || lowerResponse.includes('carbon')) {
      suggestions.push("What are eco-friendly alternatives?");
      suggestions.push("Show carbon footprint comparison");
      suggestions.push("How to improve sustainability?");
    }
    
    if (lowerQuestion.includes('disruption') || lowerResponse.includes('disruption') || lowerResponse.includes('delay')) {
      suggestions.push("What are the rerouting options?");
      suggestions.push("Notify the customer about delay");
      suggestions.push("Show all active disruptions");
    }
    
    if (shipmentIds.length > 0 && !lowerQuestion.includes('all') && !lowerQuestion.includes('list')) {
      suggestions.push("Show all my shipments");
    }
    
    // Default suggestions if none generated
    if (suggestions.length === 0) {
      suggestions.push("Show shipment analytics");
      suggestions.push("What are my pending orders?");
      suggestions.push("Check for disruptions");
    }
    
    // Limit to 3 unique suggestions
    setFollowUpSuggestions([...new Set(suggestions)].slice(0, 3));
  };

  const clearHistory = () => {
    storage.clearChatHistory();
    setMessages([]);
    // Add welcome message again
    const welcomeMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: `👋 Chat history cleared! How can I assist you today?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1
      }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className={cn(
        "fixed top-0 z-50 h-screen shadow-2xl border-l-4 border-blue-500 dark:border-blue-600 bg-gradient-to-b from-white to-blue-50 dark:from-slate-900 dark:to-slate-950 transition-all duration-300",
        isFullscreen ? "left-0 right-0 w-full" : "right-0 w-full sm:w-[400px] lg:w-[450px]"
      )}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-row items-center justify-between space-y-0 pb-3 pt-3 px-3 sm:px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 dark:from-blue-700 dark:via-blue-600 dark:to-blue-700 text-white shadow-lg">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
            <div className="relative p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5 absolute -top-0.5 -right-0.5 text-yellow-300 animate-pulse" />
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-lg sm:text-xl tracking-tight">Flexify</span>
              <span className="text-[10px] sm:text-xs font-normal opacity-90 -mt-0.5">FlexMove Intelligence</span>
            </div>
            <Badge variant="secondary" className="ml-1 bg-green-400 dark:bg-green-500 text-green-900 dark:text-green-950 border-0 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 shadow-sm">
              ● Active
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-7 w-7 sm:h-8 sm:w-8 text-white hover:bg-white/20"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen chat"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearHistory}
              className="h-7 w-7 sm:h-8 sm:w-8 text-white hover:bg-white/20"
              title="Clear chat history"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onClose?.()}
              className="h-8 w-8 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4" ref={scrollRef}>
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "flex gap-3",
                          message.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.role === "assistant" && (
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-md">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2 max-w-[80%]",
                            message.role === "user"
                              ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none shadow-md"
                              : "bg-gradient-to-br from-blue-50 to-white dark:from-slate-800 dark:to-slate-700 text-gray-900 dark:text-gray-100 rounded-bl-none border border-blue-100 dark:border-slate-600 shadow-sm"
                          )}
                        >
                          <div className="text-sm break-words">
                            {formatMessageContent(message.content)}
                          </div>
                          <div
                            className={cn(
                              "text-xs mt-1 opacity-70",
                              message.role === "user" ? "text-blue-100" : "text-gray-500"
                            )}
                          >
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                        </div>

                        {message.role === "user" && (
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Flexify anything..."
                  className="flex-1 border-blue-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:border-blue-400 focus:ring-blue-400"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 shadow-md"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Follow-up suggestions - shown after AI response */}
              {followUpSuggestions.length > 0 && !isLoading && messages.length > 1 && (
                <div className="mt-3">
                  <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Suggested follow-ups:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {followUpSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(suggestion);
                          setFollowUpSuggestions([]);
                        }}
                        className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-800/50 text-emerald-700 dark:text-emerald-200 hover:from-emerald-200 hover:to-emerald-100 dark:hover:from-emerald-800/70 dark:hover:to-emerald-700/70 transition-all border border-emerald-300 dark:border-emerald-600 shadow-sm font-medium"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Quick suggestions */}
              {messages.length <= 1 && !isLoading && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "📦 Show my shipments",
                    "⚡ Any issues?",
                    "📈 Performance stats",
                    "🌱 Carbon footprint"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900 dark:to-blue-800 text-blue-700 dark:text-blue-200 hover:from-blue-200 hover:to-blue-100 dark:hover:from-blue-800 dark:hover:to-blue-700 transition-all border border-blue-300 dark:border-blue-600 shadow-sm font-medium"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1.5">
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                  <Sparkles className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-700 dark:text-blue-300">Flexify</span>
                </div>
                <span className="opacity-60">• Powered by Gemini 2.0</span>
              </div>
            </div>
      </div>
    </motion.div>
  );
}
