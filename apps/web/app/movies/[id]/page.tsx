'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowLeft, Star, Clock, Calendar, Film, Play, Plus, Bookmark, MessageSquare } from 'lucide-react';
import { API_URL } from '../../../lib/fetcher';

interface CastMember {
  id: number;
  name: string;
  character: string | null;
  profile_path: string | null;
}

interface MediaDetails {
  id: number;
  title: string;
  overview: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  vote_average: number;
  vote_count: number;
  genres: string[];
  tagline: string | null;
  status: string;
  director?: string;
  creators?: string[];
  cast: CastMember[];
  trailer: string | null;
  media_type: 'movie' | 'tv';
}

const MovieDetailPage: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try fetching as movie first
        let response = await fetch(`${API_URL}/api/movie/${id}`);
        
        if (!response.ok) {
          // If movie not found, try as TV show
          response = await fetch(`${API_URL}/api/tv/${id}`);
        }
        
        if (!response.ok) {
          throw new Error('Content not found');
        }
        
        const data = await response.json();
        setDetails(data);
      } catch (err) {
        console.error('Error fetching details:', err);
        setError('Failed to load content details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [id]);

  const getYear = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).getFullYear();
  };

  const formatRuntime = (minutes?: number) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

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
          <Link href="/movies" className="inline-flex items-center gap-2 text-[#58b8ff] hover:underline mb-8">
            <ArrowLeft size={20} />
            Back to Movies
          </Link>
          <div className="text-center py-20">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-red-400 text-lg">{error || 'Content not found'}</p>
            <Link 
              href="/movies"
              className="mt-4 inline-block px-6 py-2 bg-[#58b8ff] rounded-lg hover:bg-[#4aa8ef] transition"
            >
              Browse Movies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const releaseDate = details.media_type === 'movie' ? details.release_date : details.first_air_date;
  const runtime = details.media_type === 'movie' ? details.runtime : details.episode_run_time;

  return (
    <div className="min-h-screen bg-[#242730] text-white">
      {/* Backdrop Image */}
      {details.backdrop_path && (
        <div className="relative h-[40vh] w-full">
          <Image
            src={details.backdrop_path}
            alt={details.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#242730] via-[#242730]/60 to-transparent" />
        </div>
      )}

      <div className="px-6 md:px-10 py-8">
        <div className="pl-12">
          {/* Back Button */}
          <Link href="/movies" className="inline-flex items-center gap-2 text-[#58b8ff] hover:underline mb-6">
            <ArrowLeft size={20} />
            Back to Movies & Shows
          </Link>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Poster */}
            <div className="w-full lg:w-1/4 flex-shrink-0">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-700 shadow-2xl">
                {details.poster_path ? (
                  <Image
                    src={details.poster_path}
                    alt={details.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film size={64} className="text-gray-500" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-6">
                {details.trailer && (
                  <a
                    href={details.trailer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#58b8ff] rounded-xl font-semibold hover:bg-[#4aa8ef] transition"
                  >
                    <Play size={18} />
                    Watch Trailer
                  </a>
                )}
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1E1E2E] border border-gray-700 rounded-xl font-semibold hover:bg-[#2a2d3a] transition">
                  <Plus size={18} />
                  Add to List
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1E1E2E] border border-gray-700 rounded-xl font-semibold hover:bg-[#2a2d3a] transition">
                  <Bookmark size={18} />
                  Add to Watchlist
                </button>
                <Link
                  href={`/reviews?id=${details.id}&type=${details.media_type}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1E1E2E] border border-gray-700 rounded-xl font-semibold hover:bg-[#2a2d3a] transition"
                >
                  <MessageSquare size={18} />
                  Rate or Review
                </Link>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1">
              {/* Title & Rating */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold">{details.title}</h1>
                  {details.tagline && (
                    <p className="text-zinc-400 italic mt-2">&ldquo;{details.tagline}&rdquo;</p>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-[#1E1E2E] px-4 py-2 rounded-xl">
                  <Star className="text-yellow-400 fill-yellow-400" size={24} />
                  <span className="text-2xl font-bold">{details.vote_average?.toFixed(1)}</span>
                  <span className="text-zinc-500 text-sm">/ 10</span>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  {getYear(releaseDate)}
                </span>
                {runtime && (
                  <span className="flex items-center gap-1">
                    <Clock size={16} />
                    {formatRuntime(runtime)}
                  </span>
                )}
                {details.media_type === 'tv' && details.number_of_seasons && (
                  <span>
                    {details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}
                  </span>
                )}
                {details.media_type === 'tv' && details.number_of_episodes && (
                  <span>
                    {details.number_of_episodes} Episode{details.number_of_episodes > 1 ? 's' : ''}
                  </span>
                )}
                <span className="px-2 py-1 bg-[#1E1E2E] rounded text-sm">
                  {details.status}
                </span>
              </div>

              {/* Genres */}
              {details.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {details.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-[#58b8ff]/20 text-[#58b8ff] rounded-full text-sm font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Director / Creators */}
              {(details.director || (details.creators && details.creators.length > 0)) && (
                <p className="mt-4 text-zinc-400">
                  <span className="text-white font-semibold">
                    {details.media_type === 'movie' ? 'Director' : 'Created by'}:
                  </span>{' '}
                  {details.director || details.creators?.join(', ')}
                </p>
              )}

              {/* Overview */}
              <div className="mt-6">
                <h2 className="text-xl font-bold mb-3">Overview</h2>
                <p className="text-zinc-300 leading-relaxed">
                  {details.overview || 'No overview available.'}
                </p>
              </div>

              {/* Cast */}
              {details.cast.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">Cast</h2>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {details.cast.map((person) => (
                      <div key={person.id} className="flex-none w-24 text-center">
                        <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-700">
                          {person.profile_path ? (
                            <Image
                              src={person.profile_path}
                              alt={person.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-bold">
                              {person.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium mt-2 line-clamp-2">{person.name}</p>
                        {person.character && (
                          <p className="text-xs text-zinc-500 line-clamp-1">{person.character}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1E1E2E] p-4 rounded-xl">
                  <p className="text-zinc-500 text-sm">Rating</p>
                  <p className="text-xl font-bold flex items-center gap-1">
                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                    {details.vote_average?.toFixed(1)}
                  </p>
                </div>
                <div className="bg-[#1E1E2E] p-4 rounded-xl">
                  <p className="text-zinc-500 text-sm">Votes</p>
                  <p className="text-xl font-bold">{details.vote_count?.toLocaleString()}</p>
                </div>
                <div className="bg-[#1E1E2E] p-4 rounded-xl">
                  <p className="text-zinc-500 text-sm">Type</p>
                  <p className="text-xl font-bold capitalize">{details.media_type === 'tv' ? 'TV Show' : 'Movie'}</p>
                </div>
                <div className="bg-[#1E1E2E] p-4 rounded-xl">
                  <p className="text-zinc-500 text-sm">Status</p>
                  <p className="text-xl font-bold">{details.status}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
