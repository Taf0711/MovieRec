'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, Film, Book, Send, Check, Search } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { API_URL } from '../../lib/fetcher';

interface MediaItem {
  id: number | string;
  title: string;
  poster_path?: string | null;
  cover_url?: string | null;
  release_date?: string;
  first_air_date?: string;
  first_publish_year?: number;
  vote_average?: number;
  genres?: string[];
  author?: string;
  media_type: 'movie' | 'tv' | 'book';
}

const ReviewsContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, session } = useAuth();
  
  const mediaId = searchParams.get('id');
  const mediaType = searchParams.get('type') as 'movie' | 'tv' | 'book' | null;

  const [media, setMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [directorScale, setDirectorScale] = useState<number | null>(null);
  const [genreScale, setGenreScale] = useState<number | null>(null);
  const [rewatchScale, setRewatchScale] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch media details if ID is provided
  useEffect(() => {
    const fetchMedia = async () => {
      if (!mediaId || !mediaType) return;
      
      setLoading(true);
      try {
        let endpoint = '';
        if (mediaType === 'movie') {
          endpoint = `${API_URL}/api/movie/${mediaId}`;
        } else if (mediaType === 'tv') {
          endpoint = `${API_URL}/api/tv/${mediaId}`;
        } else if (mediaType === 'book') {
          endpoint = `${API_URL}/api/book/${mediaId}`;
        }
        
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setMedia({ ...data, media_type: mediaType });
        }
      } catch (err) {
        console.error('Error fetching media:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMedia();
  }, [mediaId, mediaType]);

  // Search for media
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      // Fetch from all trending endpoints and filter
      const [moviesRes, showsRes, booksRes] = await Promise.all([
        fetch(`${API_URL}/api/trending/movies`),
        fetch(`${API_URL}/api/trending/shows`),
        fetch(`${API_URL}/api/trending/books`)
      ]);
      
      const [moviesData, showsData, booksData] = await Promise.all([
        moviesRes.json(),
        showsRes.json(),
        booksRes.json()
      ]);
      
      const query = searchQuery.toLowerCase();
      
      const movies = (moviesData.results || [])
        .filter((m: any) => m.title.toLowerCase().includes(query))
        .map((m: any) => ({ ...m, media_type: 'movie' }));
      
      const shows = (showsData.results || [])
        .filter((s: any) => s.title.toLowerCase().includes(query))
        .map((s: any) => ({ ...s, media_type: 'tv' }));
      
      const books = (booksData.results || [])
        .filter((b: any) => b.title.toLowerCase().includes(query))
        .map((b: any) => ({ ...b, media_type: 'book' }));
      
      setSearchResults([...movies, ...shows, ...books].slice(0, 10));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const selectMedia = (item: MediaItem) => {
    setMedia(item);
    setSearchResults([]);
    setSearchQuery('');
    // Update URL
    router.push(`/reviews?id=${item.id}&type=${item.media_type}`);
  };

  const handleSubmit = async () => {
    if (!media || rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (!user || !session?.access_token) {
      setError('Please sign in to submit a review');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/user/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          media_type: media.media_type,
          media_id: String(media.id),
          rating: rating * 2, // Convert 5-star to 10-point scale
          review_text: reviewText || null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit review');
      }
      
      setSubmitted(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setRating(0);
        setDirectorScale(null);
        setGenreScale(null);
        setRewatchScale(null);
        setReviewText('');
        setSubmitted(false);
      }, 3000);
      
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getYear = (item: MediaItem) => {
    if (item.release_date) return new Date(item.release_date).getFullYear();
    if (item.first_air_date) return new Date(item.first_air_date).getFullYear();
    if (item.first_publish_year) return item.first_publish_year;
    return 'N/A';
  };

  const getImage = (item: MediaItem) => {
    return item.poster_path || item.cover_url || null;
  };

  return (
    <div className="min-h-screen bg-[#242730] text-white px-6 md:px-10 py-8 font-sans">
      <div className="pl-12 max-w-6xl mx-auto">
        {/* Back Button */}
        <Link href="/movies" className="inline-flex items-center gap-2 text-[#58b8ff] hover:underline mb-8">
          <ArrowLeft size={20} />
          Back to Movies & Shows
        </Link>

        <h1 className="text-4xl font-bold mb-2">
          Write a <span className="text-[#58b8ff]">Review</span>
        </h1>
        <p className="text-zinc-400 mb-8">Share your thoughts and rate what you&apos;ve watched or read</p>

        {/* Search Section (if no media selected) */}
        {!media && (
          <div className="mb-8">
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search for a movie, show, or book to review..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-24 py-4 bg-[#1E1E2E] border border-gray-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-[#58b8ff] transition-all"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-[#58b8ff] rounded-lg font-semibold hover:bg-[#4aa8ef] transition disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 bg-[#1E1E2E] rounded-xl border border-gray-700 overflow-hidden">
                {searchResults.map((item) => (
                  <button
                    key={`${item.media_type}-${item.id}`}
                    onClick={() => selectMedia(item)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-[#2a2d3a] transition text-left border-b border-gray-700 last:border-0"
                  >
                    <div className="relative w-12 h-16 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                      {getImage(item) ? (
                        <Image src={getImage(item)!} alt={item.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.media_type === 'book' ? <Book size={20} /> : <Film size={20} />}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-zinc-400">
                        {getYear(item)} • <span className="capitalize">{item.media_type === 'tv' ? 'TV Show' : item.media_type}</span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse flex gap-8">
            <div className="w-64 h-96 bg-gray-700 rounded-xl" />
            <div className="flex-1 space-y-4">
              <div className="h-8 bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-700 rounded w-1/2" />
            </div>
          </div>
        ) : media ? (
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Section: Media Info */}
            <div className="w-full lg:w-1/3">
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-700">
                {getImage(media) ? (
                  <Image
                    src={getImage(media)!}
                    alt={media.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {media.media_type === 'book' ? <Book size={64} /> : <Film size={64} />}
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <h2 className="text-2xl font-bold">{media.title}</h2>
                <p className="text-zinc-400 mt-1">{getYear(media)}</p>
                
                {media.genres && media.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {media.genres.map((genre) => (
                      <span key={genre} className="px-2 py-1 bg-[#1E1E2E] rounded text-sm text-zinc-400">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                
                {media.author && (
                  <p className="text-zinc-400 mt-2">by {media.author}</p>
                )}
                
                <button
                  onClick={() => {
                    setMedia(null);
                    router.push('/reviews');
                  }}
                  className="mt-4 text-[#58b8ff] text-sm hover:underline"
                >
                  Change selection
                </button>
              </div>
            </div>

            {/* Right Section: Review Form */}
            <div className="flex-1 lg:border-l border-gray-700 lg:pl-10">
              {/* Star Rating */}
              <div className="mb-8">
                <p className="font-semibold mb-3 text-lg">Your Rating</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-4xl transition-transform hover:scale-110"
                    >
                      <Star
                        size={40}
                        className={
                          star <= (hoverRating || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-600'
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-4 text-2xl font-bold text-zinc-400 self-center">
                    {rating > 0 ? `${rating}/5` : ''}
                  </span>
                </div>
              </div>

              {/* Scale Questions */}
              <div className="space-y-6 mb-8">
                <ScaleQuestion
                  title="On a scale from 1 to 10..."
                  subtitle={media.media_type === 'book' 
                    ? "How likely are you to read more from this author?"
                    : "How likely are you to watch more from this director/creator?"
                  }
                  value={directorScale}
                  setValue={setDirectorScale}
                />
                <ScaleQuestion
                  subtitle={media.media_type === 'book'
                    ? "How likely are you to read more from this genre?"
                    : "How likely are you to watch more from this genre?"
                  }
                  value={genreScale}
                  setValue={setGenreScale}
                />
                <ScaleQuestion
                  subtitle={media.media_type === 'book'
                    ? "How likely are you to re-read this?"
                    : "How likely are you to rewatch this?"
                  }
                  value={rewatchScale}
                  setValue={setRewatchScale}
                />
              </div>

              {/* Review Text */}
              <div className="mb-8">
                <p className="font-semibold mb-3 text-lg">Write Your Review</p>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts... What did you like or dislike? Would you recommend it?"
                  className="w-full h-40 px-4 py-3 rounded-xl bg-[#1E1E2E] border border-gray-700 text-white resize-none focus:outline-none focus:border-[#58b8ff] transition placeholder-zinc-500"
                />
                <p className="text-sm text-zinc-500 mt-2">{reviewText.length} characters</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                  {error}
                </div>
              )}

              {/* Not Signed In Warning */}
              {!user && (
                <div className="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-yellow-400">
                  <Link href="/auth" className="underline hover:no-underline">Sign in</Link> to save your review
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={submitting || submitted || rating === 0}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all ${
                  submitted
                    ? 'bg-green-500 text-white'
                    : rating === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-[#58b8ff] text-white hover:bg-[#4aa8ef]'
                }`}
              >
                {submitted ? (
                  <>
                    <Check size={24} />
                    Review Submitted!
                  </>
                ) : submitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send size={20} />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-[#1E1E2E] rounded-xl">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">Search for something to review above</p>
            <p className="text-zinc-500 text-sm mt-2">or browse from the movies/books pages and click &quot;Rate or Review&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Scale Question Component
const ScaleQuestion: React.FC<{
  title?: string;
  subtitle: string;
  value: number | null;
  setValue: (n: number | null) => void;
}> = ({ title, subtitle, value, setValue }) => {
  return (
    <div>
      {title && <p className="font-semibold mb-1">{title}</p>}
      <p className="text-zinc-400 mb-3">{subtitle}</p>
      <div className="flex flex-wrap items-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            onClick={() => setValue(n)}
            className={`w-9 h-9 rounded-lg font-semibold transition-all ${
              value === n
                ? 'bg-[#58b8ff] text-white'
                : 'bg-[#1E1E2E] text-gray-500 hover:bg-[#2a2d3a] hover:text-white'
            }`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => setValue(null)}
          className={`ml-2 px-3 h-9 rounded-lg text-sm font-semibold transition-all ${
            value === null
              ? 'bg-[#58b8ff] text-white'
              : 'bg-[#1E1E2E] text-gray-500 hover:bg-[#2a2d3a] hover:text-white'
          }`}
        >
          N/A
        </button>
      </div>
    </div>
  );
};

// Loading fallback for Suspense
function ReviewsLoading() {
  return (
    <div className="min-h-screen bg-[#242730] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#58b8ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading reviews...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
const ReviewsPage: React.FC = () => {
  return (
    <Suspense fallback={<ReviewsLoading />}>
      <ReviewsContent />
    </Suspense>
  );
};

export default ReviewsPage;
