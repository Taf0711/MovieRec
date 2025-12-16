'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Film, Tv, Star } from 'lucide-react';
import { API_URL } from '../../lib/fetcher';

interface MediaItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview?: string;
}

const MoviesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movies' | 'shows'>('movies');
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [shows, setShows] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [moviesRes, showsRes] = await Promise.all([
          fetch(`${API_URL}/api/trending/movies`),
          fetch(`${API_URL}/api/trending/shows`)
        ]);
        
        if (!moviesRes.ok || !showsRes.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const moviesData = await moviesRes.json();
        const showsData = await showsRes.json();
        
        setMovies(moviesData.results || []);
        setShows(showsData.results || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const currentItems = activeTab === 'movies' ? movies : shows;
  
  const filteredItems = currentItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getYear = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).getFullYear();
  };

  return (
    <div className="min-h-screen bg-[#242730] text-white px-6 md:px-10 py-8 font-sans">
      {/* Header */}
      <header className="mb-8 pl-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Movies & <span className="text-[#58b8ff]">Shows</span>
        </h1>
        <p className="text-zinc-400 mt-2 text-lg">
          Discover what&apos;s trending this week
        </p>
      </header>

      {/* Search and Tabs */}
      <div className="pl-12 mb-8">
        {/* Search Bar */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#1E1E2E] border border-gray-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#58b8ff] transition-all"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('movies')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'movies'
                ? 'bg-[#58b8ff] text-white'
                : 'bg-[#1E1E2E] text-zinc-400 hover:bg-[#2a2d3a] hover:text-white'
            }`}
          >
            <Film className="w-5 h-5" />
            Movies
            <span className="ml-1 px-2 py-0.5 text-xs bg-black/20 rounded-full">
              {movies.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('shows')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'shows'
                ? 'bg-[#58b8ff] text-white'
                : 'bg-[#1E1E2E] text-zinc-400 hover:bg-[#2a2d3a] hover:text-white'
            }`}
          >
            <Tv className="w-5 h-5" />
            TV Shows
            <span className="ml-1 px-2 py-0.5 text-xs bg-black/20 rounded-full">
              {shows.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="pl-12">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full h-52 bg-gray-700 rounded-lg mb-3" />
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-red-400 text-lg">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-[#58b8ff] rounded-lg hover:bg-[#4aa8ef] transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">
              {searchQuery ? `No results for "${searchQuery}"` : 'No content available'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                href={`/movies/${item.id}`}
                className="group"
              >
                {/* Card */}
                <div className="relative w-full h-52 rounded-lg overflow-hidden bg-gray-700 group-hover:ring-2 ring-[#58b8ff] transition-all">
                  {item.poster_path ? (
                    <Image
                      src={item.poster_path}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Film size={48} />
                    </div>
                  )}
                  
                  {/* Rating Badge */}
                  <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                    {item.vote_average?.toFixed(1) || 'N/A'}
                  </div>
                  
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs text-zinc-300 line-clamp-3">
                        {item.overview || 'No description available.'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Info */}
                <p className="text-sm font-medium mt-2 leading-tight line-clamp-2 group-hover:text-[#58b8ff] transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-gray-400">{getYear(item.release_date)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviesPage;
