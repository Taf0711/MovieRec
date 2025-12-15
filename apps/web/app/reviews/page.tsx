"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const ReviewsPage: React.FC = () => {
  const [rating, setRating] = useState(0);
  const [scale1, setScale1] = useState<number | null | undefined>(undefined);
  const [scale2, setScale2] = useState<number | null | undefined>(undefined);
  const [scale3, setScale3] = useState<number | null | undefined>(undefined);

  return (
    <main className="min-h-screen bg-[#242730] text-white px-10 py-8 font-sans">
      <Link href="/movies">
        <div className="mb-6 cursor-pointer hover:underline">
          ← Return to Description Page
        </div>
      </Link>
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-1/2">
          <div className="relative w-full h-[520px] bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <Image
              src="/images/arcane.jpg"
              alt="Arcane Season 2"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="mt-6">
            <h1 className="text-3xl font-bold">Arcane Season 2</h1>
            <p className="text-gray-400 mt-1">2025</p>

            <p className="text-gray-400 mt-2">
              <span className="text-gray-300 font-semibold">Genres:</span>{" "}
              Animation, Action, Drama
            </p>
            <div className="mt-8">
              <p className="mb-2 font-semibold">Give a rating</p>
              <div className="flex gap-2 text-3xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={
                      star <= rating
                        ? "text-yellow-400"
                        : "text-gray-600"
                    }
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 border-l border-gray-600 pl-10">
          <div className="space-y-8">
            <Question
              title="On a scale from 1 to 10 how likely are you to…"
              subtitle="watch something from this director again?"
              value={scale1}
              setValue={setScale1}
            />
            <Question
              subtitle="watch something from the same genre?"
              value={scale2}
              setValue={setScale2}
            />
            <Question
              subtitle="watch this movie again?"
              value={scale3}
              setValue={setScale3}
            />
            <div>
              <p className="font-semibold mb-2">
                Was this a recommendation? If so, was it a good one?
              </p>
              <input
                type="text"
                placeholder="Not sure"
                className="w-full h-12 px-4 rounded-md bg-[#2f3340] border border-gray-600 text-white focus:outline-none"
              />
            </div>
            <div>
              <p className="font-semibold mb-2">Write down your review</p>
              <textarea
                placeholder="Write your review here"
                className="w-full h-40 px-4 py-3 rounded-md bg-[#2f3340] border border-gray-600 text-white resize-none focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const Question = ({
  title,
  subtitle,
  value,
  setValue,
}: {
  title?: string;
  subtitle: string;
  value: number | null | undefined;
  setValue: (n: number | null) => void;
}) => {
  return (
    <div>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <p className="text-gray-300 mb-3">{subtitle}</p>
      <div className="flex items-center gap-4">
        <div className="flex gap-4 text-xl font-semibold">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => setValue(n)}
              className={`transition-colors ${value === n
                ? "text-[#58b8ff]"
                : "text-gray-500 hover:text-gray-300"
                }`}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          onClick={() => setValue(null)}
          className={`ml-auto text-sm font-semibold transition-colors ${value === null
            ? "text-[#58b8ff]"
            : "text-gray-500 hover:text-gray-300"
            }`}
        >
          Not sure
        </button>
      </div>
    </div>
  );
};

export default ReviewsPage;
