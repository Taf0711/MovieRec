'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Book, User, Calendar } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface BookItem {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  first_publish_year: number | null;
}

const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_URL}/api/trending/books`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch books');
        }
        
        const data = await response.json();
        setBooks(data.results || []);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to load books. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooks();
  }, []);

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#242730] text-white px-6 md:px-10 py-8 font-sans">
      {/* Header */}
      <header className="mb-8 pl-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Book <span className="text-[#58b8ff]">Collection</span>
        </h1>
        <p className="text-zinc-400 mt-2 text-lg">
          Explore trending books from Open Library
        </p>
      </header>

      {/* Search and View Toggle */}
      <div className="pl-12 mb-8">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1E1E2E] border border-gray-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#58b8ff] transition-all"
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition ${
                viewMode === 'grid' 
                  ? 'bg-[#58b8ff] text-white' 
                  : 'bg-[#1E1E2E] text-zinc-400 hover:bg-[#2a2d3a] hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition ${
                viewMode === 'list' 
                  ? 'bg-[#58b8ff] text-white' 
                  : 'bg-[#1E1E2E] text-zinc-400 hover:bg-[#2a2d3a] hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Book Count */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#1E1E2E] rounded-xl text-zinc-400">
            <Book className="w-5 h-5" />
            <span>{filteredBooks.length} books</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pl-12">
        {loading ? (
          <div className={viewMode === 'grid' 
            ? "grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            : "flex flex-col gap-4"
          }>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                {viewMode === 'grid' ? (
                  <>
                    <div className="w-full h-52 bg-gray-700 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </>
                ) : (
                  <div className="flex gap-4 p-4 bg-[#1E1E2E] rounded-xl">
                    <div className="w-16 h-24 bg-gray-700 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <Book className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-red-400 text-lg">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-[#58b8ff] rounded-lg hover:bg-[#4aa8ef] transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-20">
            <Book className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg">
              {searchQuery ? `No books found for "${searchQuery}"` : 'No books available'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredBooks.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="group"
              >
                {/* Card */}
                <div className="relative w-full h-52 rounded-lg overflow-hidden bg-gray-700 group-hover:ring-2 ring-[#58b8ff] transition-all">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gradient-to-br from-[#1E1E2E] to-[#2a2d3a] p-4">
                      <Book size={32} className="mb-2" />
                      <p className="text-xs text-center line-clamp-3 text-gray-400">{book.title}</p>
                    </div>
                  )}
                  
                  {/* Year Badge */}
                  {book.first_publish_year && (
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs">
                      {book.first_publish_year}
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <p className="text-sm font-medium mt-2 leading-tight line-clamp-2 group-hover:text-[#58b8ff] transition-colors">
                  {book.title}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <User size={10} />
                  {book.author}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col gap-4">
            {filteredBooks.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="group flex gap-4 p-4 bg-[#1E1E2E] rounded-xl hover:bg-[#2a2d3a] transition-colors"
              >
                {/* Cover */}
                <div className="relative w-16 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-700">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Book size={24} />
                    </div>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white group-hover:text-[#58b8ff] transition-colors line-clamp-1">
                    {book.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {book.author}
                    </span>
                    {book.first_publish_year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {book.first_publish_year}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="flex items-center text-gray-600 group-hover:text-[#58b8ff] transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BooksPage;
