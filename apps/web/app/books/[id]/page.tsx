'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowLeft, Book, User, Calendar, Tag, Plus, Bookmark, MessageSquare, ExternalLink, Check, Loader2 } from 'lucide-react';
import { API_URL, addToList } from '../../../lib/fetcher';
import { useAuth } from '../../../lib/AuthContext';

interface Author {
  name: string;
  bio: string | null;
  photo: string | null;
}

interface BookDetails {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  cover_url_large: string | null;
  authors: Author[];
  subjects: string[];
  first_publish_year: string | null;
  revision: number;
  media_type: 'book';
}

const BookDetailPage: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const { user, session } = useAuth();
  
  const [details, setDetails] = useState<BookDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Button states
  const [addingToFavorites, setAddingToFavorites] = useState(false);
  const [addedToFavorites, setAddedToFavorites] = useState(false);
  const [addingToReadingList, setAddingToReadingList] = useState(false);
  const [addedToReadingList, setAddedToReadingList] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAddToList = async (listType: 'favorites' | 'reading_list') => {
    if (!user || !session?.access_token) {
      setActionError('Please sign in to add to your list');
      setTimeout(() => setActionError(null), 3000);
      return;
    }
    
    if (!details) return;
    
    const setAdding = listType === 'favorites' ? setAddingToFavorites : setAddingToReadingList;
    const setAdded = listType === 'favorites' ? setAddedToFavorites : setAddedToReadingList;
    
    setAdding(true);
    setActionError(null);
    
    try {
      await addToList(session.access_token, {
        list_type: listType,
        media_type: 'book',
        media_id: String(details.id),
        title: details.title,
        image_url: details.cover_url || undefined,
      });
      
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (err) {
      console.error('Error adding to list:', err);
      setActionError('Failed to add to list. Please try again.');
      setTimeout(() => setActionError(null), 3000);
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_URL}/api/book/${id}`);
        
        if (!response.ok) {
          throw new Error('Book not found');
        }
        
        const data = await response.json();
        setDetails(data);
      } catch (err) {
        console.error('Error fetching details:', err);
        setError('Failed to load book details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#242730] text-white px-6 md:px-10 py-8">
        <div className="pl-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-48 mb-8" />
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-1/3">
                <div className="aspect-[2/3] bg-gray-700 rounded-xl" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="h-10 bg-gray-700 rounded w-3/4" />
                <div className="h-6 bg-gray-700 rounded w-1/2" />
                <div className="h-32 bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen bg-[#242730] text-white px-6 md:px-10 py-8">
        <div className="pl-12">
          <Link href="/books" className="inline-flex items-center gap-2 text-[#58b8ff] hover:underline mb-8">
            <ArrowLeft size={20} />
            Back to Books
          </Link>
          <div className="text-center py-20">
            <Book className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-red-400 text-lg">{error || 'Book not found'}</p>
            <Link 
              href="/books"
              className="mt-4 inline-block px-6 py-2 bg-[#58b8ff] rounded-lg hover:bg-[#4aa8ef] transition"
            >
              Browse Books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const authorNames = details.authors.map(a => a.name).join(', ') || 'Unknown Author';

  return (
    <div className="min-h-screen bg-[#242730] text-white">
      {/* Hero Background */}
      <div className="relative h-[30vh] w-full bg-gradient-to-br from-[#1a3a5c] via-[#242730] to-[#2d1f3d]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#242730] via-transparent to-transparent" />
      </div>

      <div className="px-6 md:px-10 py-8 -mt-32 relative z-10">
        <div className="pl-12 max-w-6xl mx-auto">
          {/* Back Button */}
          <Link href="/books" className="inline-flex items-center gap-2 text-[#58b8ff] hover:underline mb-6">
            <ArrowLeft size={20} />
            Back to Books
          </Link>

          <div className="flex flex-col lg:flex-row gap-10">
            {/* Book Cover */}
            <div className="w-full lg:w-1/3 flex-shrink-0">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-700 shadow-2xl">
                {details.cover_url ? (
                  <Image
                    src={details.cover_url}
                    alt={details.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2d3748] to-[#1a202c] p-6">
                    <Book size={64} className="text-gray-500 mb-4" />
                    <p className="text-gray-400 text-center font-medium">{details.title}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-6">
                <a
                  href={`https://openlibrary.org/works/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#58b8ff] rounded-xl font-semibold hover:bg-[#4aa8ef] transition"
                >
                  <ExternalLink size={18} />
                  View on Open Library
                </a>
                <button
                  onClick={() => handleAddToList('favorites')}
                  disabled={addingToFavorites || addedToFavorites}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition ${
                    addedToFavorites
                      ? 'bg-green-500 text-white'
                      : 'bg-[#1E1E2E] border border-gray-700 hover:bg-[#2a2d3a]'
                  }`}
                >
                  {addingToFavorites ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : addedToFavorites ? (
                    <Check size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  {addedToFavorites ? 'Added to Favorites!' : 'Add to Favorites'}
                </button>
                <button
                  onClick={() => handleAddToList('reading_list')}
                  disabled={addingToReadingList || addedToReadingList}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition ${
                    addedToReadingList
                      ? 'bg-green-500 text-white'
                      : 'bg-[#1E1E2E] border border-gray-700 hover:bg-[#2a2d3a]'
                  }`}
                >
                  {addingToReadingList ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : addedToReadingList ? (
                    <Check size={18} />
                  ) : (
                    <Bookmark size={18} />
                  )}
                  {addedToReadingList ? 'Added to Reading List!' : 'Add to Reading List'}
                </button>
                <Link
                  href={`/reviews?id=${details.id}&type=book`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1E1E2E] border border-gray-700 rounded-xl font-semibold hover:bg-[#2a2d3a] transition"
                >
                  <MessageSquare size={18} />
                  Rate or Review
                </Link>
                {actionError && (
                  <p className="text-red-400 text-sm text-center">{actionError}</p>
                )}
                {!user && (
                  <p className="text-zinc-500 text-sm text-center">
                    <Link href="/auth" className="text-[#58b8ff] hover:underline">Sign in</Link> to save to your lists
                  </p>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1">
              {/* Title */}
              <h1 className="text-4xl font-bold">{details.title}</h1>
              
              {/* Author */}
              <p className="text-xl text-[#58b8ff] mt-2 flex items-center gap-2">
                <User size={20} />
                {authorNames}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-zinc-400">
                {details.first_publish_year && (
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    First published {details.first_publish_year}
                  </span>
                )}
                <span className="px-2 py-1 bg-[#1E1E2E] rounded text-sm">
                  Book
                </span>
              </div>

              {/* Subjects/Genres */}
              {details.subjects.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Tag size={18} />
                    Subjects
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {details.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="px-3 py-1 bg-[#58b8ff]/20 text-[#58b8ff] rounded-full text-sm font-medium"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-3">Description</h2>
                <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
                  {details.description || 'No description available for this book.'}
                </p>
              </div>

              {/* Authors Section */}
              {details.authors.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">About the Author{details.authors.length > 1 ? 's' : ''}</h2>
                  <div className="space-y-4">
                    {details.authors.map((author, index) => (
                      <div key={index} className="flex gap-4 p-4 bg-[#1E1E2E] rounded-xl">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                          {author.photo ? (
                            <Image
                              src={author.photo}
                              alt={author.name}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-bold">
                            {author.name.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{author.name}</h3>
                          {author.bio && (
                            <p className="text-sm text-zinc-400 mt-1 line-clamp-3">{author.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-[#1E1E2E] p-4 rounded-xl">
                  <p className="text-zinc-500 text-sm">Type</p>
                  <p className="text-xl font-bold">Book</p>
                </div>
                {details.first_publish_year && (
                  <div className="bg-[#1E1E2E] p-4 rounded-xl">
                    <p className="text-zinc-500 text-sm">Published</p>
                    <p className="text-xl font-bold">{details.first_publish_year}</p>
                  </div>
                )}
                <div className="bg-[#1E1E2E] p-4 rounded-xl">
                  <p className="text-zinc-500 text-sm">Subjects</p>
                  <p className="text-xl font-bold">{details.subjects.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailPage;
