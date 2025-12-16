'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { getTrendingMovies, getTrendingShows, getTrendingBooks } from '../lib/fetcher';
import { Star, TrendingUp, Book, Film, Tv } from 'lucide-react';

interface TrendingMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview?: string;
}

interface TrendingBook {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  first_publish_year: number;
}

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([]);
  const [trendingShows, setTrendingShows] = useState<TrendingMovie[]>([]);
  const [trendingBooks, setTrendingBooks] = useState<TrendingBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const [movies, shows, books] = await Promise.all([
          getTrendingMovies(),
          getTrendingShows(),
          getTrendingBooks(),
        ]);
        setTrendingMovies(movies);
        setTrendingShows(shows);
        setTrendingBooks(books);
      } catch (error) {
        console.error('Failed to fetch trending data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTrending();
  }, []);

  const displayName = user?.email?.split('@')[0] || 'Guest';

  return (
    <div className="min-h-screen bg-[#242730] text-white px-6 md:px-10 py-8 font-sans">
      {/* Header */}
      <header className="mb-10 pl-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Hello, <span className="text-[#58b8ff]">{displayName}!</span>
        </h1>
        <p className="text-zinc-400 mt-2 text-lg">
          Discover trending movies, shows, and books...
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section - Trending Movies */}
        <div className="space-y-8">
          <TrendingSection
            title="Trending Movies"
            icon={<Film size={20} />}
            items={trendingMovies}
            loading={loading}
            type="movie"
          />
          <TrendingSection
            title="Trending Shows"
            icon={<Tv size={20} />}
            items={trendingShows}
            loading={loading}
            type="show"
          />
        </div>

        {/* Middle Section - Featured */}
        <div className="lg:border-x border-gray-700/50 lg:px-6">
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-[#58b8ff]" />
              <h2 className="text-xl font-bold">This Week&apos;s Picks</h2>
            </div>
            
            {loading ? (
              <LoadingGrid count={3} />
            ) : (
              <div className="space-y-4">
                {trendingMovies.slice(0, 3).map((movie, index) => (
                  <Link
                    key={movie.id}
                    href={`/movies/${movie.id}`}
                    className="flex gap-4 p-3 bg-[#1E1E2E] rounded-xl hover:bg-[#2a2d3a] transition-colors"
                  >
                    <div className="relative w-20 h-28 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                      {movie.poster_path ? (
                        <Image
                          src={movie.poster_path}
                          alt={movie.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <Film size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-[#58b8ff] font-semibold">#{index + 1} Trending</span>
                      <h3 className="font-semibold text-white mt-1 truncate">{movie.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {movie.release_date?.split('-')[0]}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-sm text-gray-300">{movie.vote_average?.toFixed(1)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right Section - Books */}
        <div>
          <BooksSection
            title="Trending Books"
            books={trendingBooks}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

// Trending Movies/Shows Section
const TrendingSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  items: TrendingMovie[];
  loading: boolean;
  type: 'movie' | 'show';
}> = ({ title, icon, items, loading, type }) => {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#58b8ff]">{icon}</span>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      {loading ? (
        <LoadingGrid count={4} />
      ) : (
        <div className="relative">
          <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
            {items.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={`/movies/${item.id}`}
                className="flex-none w-36 group"
              >
                <div className="relative w-36 h-52 rounded-lg overflow-hidden bg-gray-700 group-hover:ring-2 ring-[#58b8ff] transition-all">
                  {item.poster_path ? (
                    <Image
                      src={item.poster_path}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Film size={32} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    {item.vote_average?.toFixed(1)}
                  </div>
                </div>
                <p className="text-sm font-medium mt-2 leading-tight line-clamp-2 group-hover:text-[#58b8ff] transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400">{item.release_date?.split('-')[0]}</p>
              </Link>
            ))}
          </div>
          <div className="absolute top-0 right-0 h-52 w-12 bg-gradient-to-l from-[#242730] to-transparent pointer-events-none" />
        </div>
      )}
    </section>
  );
};

// Books Section
const BooksSection: React.FC<{
  title: string;
  books: TrendingBook[];
  loading: boolean;
}> = ({ title, books, loading }) => {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Book size={20} className="text-[#58b8ff]" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-16 h-24 bg-gray-700 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {books.slice(0, 8).map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="flex gap-3 p-2 rounded-lg hover:bg-[#1E1E2E] transition-colors group"
            >
              <div className="relative w-14 h-20 rounded-md overflow-hidden bg-gray-700 flex-shrink-0">
                {book.cover_url ? (
                  <Image
                    src={book.cover_url}
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <Book size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium line-clamp-2 group-hover:text-[#58b8ff] transition-colors">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{book.author}</p>
                {book.first_publish_year && (
                  <p className="text-xs text-gray-500">{book.first_publish_year}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

// Loading Grid
const LoadingGrid: React.FC<{ count: number }> = ({ count }) => {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex-none w-36 animate-pulse">
          <div className="w-36 h-52 bg-gray-700 rounded-lg" />
          <div className="h-4 bg-gray-700 rounded mt-2 w-3/4" />
          <div className="h-3 bg-gray-700 rounded mt-1 w-1/2" />
        </div>
      ))}
    </div>
  );
};

export default HomePage;
