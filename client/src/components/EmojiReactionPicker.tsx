import { useState } from "react";
import { Button } from "@/components/ui/button";

interface EmojiReactionPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const REACTION_EMOJIS = [
  "❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥", "💯", "👏", "🎉", "😍"
];

export function EmojiReactionPicker({ onEmojiSelect, onClose }: EmojiReactionPickerProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 flex flex-wrap gap-1 max-w-[200px] z-50">
      {REACTION_EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-lg transition-colors"
          onClick={() => {
            console.log('تم اختيار الرمز التعبيري:', emoji);
            onEmojiSelect(emoji);
            onClose();
          }}
        >
          {emoji}
        </Button>
      ))}
    </div>
  );
}