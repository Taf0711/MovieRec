"use client";

import React, { useState } from "react";
import Link from "next/link";
import { API_URL } from "../../lib/fetcher";

interface Movie {
  id: number;
  title: string;
  rating: number;
}


const RecommendationsPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([
    { id: 1, title: "", rating: 5 },
    { id: 2, title: "", rating: 5 },
    { id: 3, title: "", rating: 5 },
  ]);


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string>("");

  const addMovieField = () => {
    setMovies([...movies, { id: movies.length + 1, title: "", rating: 5 }]);
  };

  const removeMovieField = (id: number) => {
    if (movies.length > 1) {
      setMovies(movies.filter((movie) => movie.id !== id));
    }
  };

  const updateMovie = (
    id: number,
    field: keyof Movie,
    value: string | number
  ) => {
    setMovies(
      movies.map((movie) =>
        movie.id === id ? { ...movie, [field]: value } : movie
      )
    );
  };

  const hasMinimumMovies = () => {
    const validMovies = movies.filter((movie) => movie.title.trim() !== "");
    return validMovies.length >= 3;
  };

  const getRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Filter out movies without titles
      const validMovies = movies.filter((movie) => movie.title.trim() !== "");
      
      const res = await fetch(`${API_URL}/api/recs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movies: validMovies.map((m) => ({ title: m.title, rating: m.rating })),
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      setAiResponse(data.recommendation || "No recommendations received");
    } catch (err) {
      console.error("Recommendation error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };
  const retryRecommendation = () => {
    getRecommendations();
  };

  const isGetButtonDisabled = isLoading || !hasMinimumMovies();

  return (
    <main className="min-h-screen bg-[#242730] text-white px-4 md:px-10 py-8 font-sans text-[15px]">
      <Link href="/movies">
        <div className="mb-6 cursor-pointer hover:underline inline-flex items-center gap-2 text-sm text-gray-300">
          <span>←</span>
          <span>Return to Movies Page</span>
        </div>
      </Link>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-8">
          Get Movie Recommendations
        </h1>

        {/* Reco Form */}
        <div className="bg-[#1E1E2E] rounded-xl p-6 mb-8 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Rate Your Movies</h2>
            <button
              onClick={addMovieField}
              className="bg-[#58b8ff] hover:bg-[#4aa8ee] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              + Add Movie
            </button>
          </div>

          {movies.map((movie) => (
            <div
              key={movie.id}
              className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4 p-4 bg-[#2a2d3a]/80 rounded-lg border border-white/5"
            >
              {/* Title */}
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5 text-gray-400">
                  Movie Title
                </label>
                <input
                  type="text"
                  value={movie.title}
                  onChange={(e) =>
                    updateMovie(movie.id, "title", e.target.value)
                  }
                  placeholder="Enter movie title..."
                  className="w-full h-10 px-3 rounded-md bg-[#2f3340] border border-gray-600/60 text-white text-sm focus:outline-none focus:border-[#58b8ff]"
                />
              </div>

              {/* Rating */}
              <div className="flex flex-col gap-1">
                <label className="block text-xs font-medium text-gray-400">
                  Rating
                </label>

                <div className="flex items-center gap-2">
                  {/* Slider */}
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={movie.rating}
                    onChange={(e) =>
                      updateMovie(
                        movie.id,
                        "rating",
                        parseInt(e.target.value)
                      )
                    }
                    className="
                      w-28 h-1.5 appearance-none rounded-full cursor-pointer
                      bg-gradient-to-r from-[#58b8ff] to-[#8fd3ff]
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-4
                      [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-white
                      [&::-webkit-slider-thumb]:shadow
                      [&::-webkit-slider-thumb]:border
                      [&::-webkit-slider-thumb]:border-[#58b8ff]
                    "
                  />

                  {/* Number input */}
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={movie.rating}
                    onChange={(e) =>
                      updateMovie(
                        movie.id,
                        "rating",
                        Math.min(10, Math.max(1, Number(e.target.value)))
                      )
                    }
                    className="w-14 h-8 text-xs text-center rounded-md bg-[#1e2130] border border-white/10 text-gray-200 focus:outline-none focus:border-[#58b8ff]"
                  />
                </div>
              </div>

              {/* Remove */}
              {movies.length > 1 && (
                <div className="flex items-center">
                  <button
                    onClick={() => removeMovieField(movie.id)}
                    aria-label="Remove movie"
                    className="text-gray-400 hover:text-red-400 transition-colors text-2xl leading-none px-2"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              onClick={getRecommendations}
              disabled={isGetButtonDisabled}
              className="w-full bg-[#58b8ff] hover:bg-[#4aa8ee] disabled:bg-gray-600 text-white px-6 py-2.5 rounded-lg font-semibold text-base transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Getting Recommendations...</span>
                </>
              ) : (
                <span>Get AI Recommendations</span>
              )}
            </button>

            {!hasMinimumMovies() && (
              <p className="mt-2 text-xs text-gray-400">
                Please enter at least three movies with titles.
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-lg">
            <p className="text-red-400 text-sm font-medium">
              Error: {error}
            </p>
          </div>
        )}

        {/* AI Window */}
        <div className="bg-[#1E1E2E] rounded-xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">AI Response</h2>
            <button
              onClick={retryRecommendation}
              className="bg-[#3a3d4a]/80 hover:bg-[#4a4d5a] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={aiResponse || "Your recommendations will appear here..."}
              className="w-full h-[400px] px-4 py-3 rounded-lg bg-[#2a2d3a] border border-white/10 text-gray-100 font-mono text-sm resize-none focus:outline-none"
            />

            {aiResponse && (
              <button
                onClick={() => navigator.clipboard.writeText(aiResponse)}
                className="absolute top-2 right-2 bg-[#3a3d4a]/80 hover:bg-[#4a4d5a] text-white px-2.5 py-1 rounded text-xs transition-colors"
              >
                Copy
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default RecommendationsPage;
