"use client";

import { ReactNode } from "react";

interface FlashCardProps {
  flipped: boolean;
  front: ReactNode;
  back: ReactNode;
}

export default function FlashCard({ flipped, front, back }: FlashCardProps) {
  if (!flipped) {
    return (
      <div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col items-center justify-center min-h-[180px]">
        {front}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex flex-col items-center gap-3">
      {back}
    </div>
  );
}
