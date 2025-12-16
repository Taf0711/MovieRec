"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../../lib/AuthContext";
import { getUserProfile, getUserReviews, getUserLists, getUserStats } from "../../lib/fetcher";
import { User, Star, Film, Book, Heart, Clock, Edit2, LogOut, BookOpen } from "lucide-react";

interface Review {
  id: string;
  media_type: string;
  media_id: string;
  rating: number;
  review_text: string;
  created_at: string;
}

interface ListItem {
  id: string;
  list_type: string;
  media_type: string;
  media_id: string;
  title: string;
  image_url: string;
  created_at: string;
}

interface UserStats {
  total_reviews: number;
  total_movies: number;
  total_books: number;
}

interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  created_at?: string;
}

const ProfilePage: React.FC = () => {
  const { user, session, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [watchlist, setWatchlist] = useState<ListItem[]>([]);
  const [favorites, setFavorites] = useState<ListItem[]>([]);
  const [readingList, setReadingList] = useState<ListItem[]>([]);
  const [stats, setStats] = useState<UserStats>({ total_reviews: 0, total_movies: 0, total_books: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }

    async function fetchUserData() {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const [profileData, reviewsData, watchlistData, favoritesData, readingListData, statsData] = await Promise.allSettled([
          getUserProfile(session.access_token),
          getUserReviews(session.access_token),
          getUserLists(session.access_token, "watchlist"),
          getUserLists(session.access_token, "favorites"),
          getUserLists(session.access_token, "reading_list"),
          getUserStats(session.access_token),
        ]);

        if (profileData.status === "fulfilled") setProfile(profileData.value);
        if (reviewsData.status === "fulfilled") setReviews(reviewsData.value);
        if (watchlistData.status === "fulfilled") setWatchlist(watchlistData.value);
        if (favoritesData.status === "fulfilled") setFavorites(favoritesData.value);
        if (readingListData.status === "fulfilled") setReadingList(readingListData.value);
        if (statsData.status === "fulfilled") setStats(statsData.value);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (user && session) {
      fetchUserData();
    }
  }, [user, session, authLoading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-[#242730] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-8 h-8 border-2 border-[#58b8ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.username || user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-[#242730] text-white font-sans p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-[#1E1E2E] rounded-2xl p-6 md:p-8 mb-8 border border-white/5">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#58b8ff] to-purple-500 p-1">
                <div className="w-full h-full rounded-full bg-[#1E1E2E] flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={displayName}
                      width={112}
                      height={112}
                      className="object-cover"
                    />
                  ) : (
                    <User size={48} className="text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold">{displayName}</h1>
              <p className="text-gray-400 mt-1">{user.email}</p>
              {profile?.created_at && (
                <p className="text-sm text-gray-500 mt-2">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-[#2a2d3a] hover:bg-[#3a3d4a] rounded-lg transition-colors">
                <Edit2 size={16} />
                Edit Profile
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#58b8ff]">{stats.total_movies}</p>
              <p className="text-sm text-gray-400 mt-1">Movies & Shows</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-400">{stats.total_books}</p>
              <p className="text-sm text-gray-400 mt-1">Books</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-pink-400">{stats.total_reviews}</p>
              <p className="text-sm text-gray-400 mt-1">Reviews</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Recent Reviews */}
          <div className="bg-[#1E1E2E] rounded-xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Star size={20} className="text-yellow-400" />
              <h2 className="text-lg font-semibold">Recent Reviews</h2>
            </div>

            {loading ? (
              <LoadingSkeleton count={3} />
            ) : reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className="p-3 bg-[#2a2d3a] rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {review.media_type}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-sm">{review.rating}/10</span>
                      </div>
                    </div>
                    {review.review_text && (
                      <p className="text-sm text-gray-400 line-clamp-2">
                        {review.review_text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Star size={32} />}
                message="No reviews yet"
                action={{ label: "Write a Review", href: "/reviews" }}
              />
            )}
          </div>

          {/* Watchlist */}
          <div className="bg-[#1E1E2E] rounded-xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className="text-[#58b8ff]" />
              <h2 className="text-lg font-semibold">Watchlist</h2>
            </div>

            {loading ? (
              <LoadingSkeleton count={3} />
            ) : watchlist.length > 0 ? (
              <div className="space-y-3">
                {watchlist.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 bg-[#2a2d3a] rounded-lg"
                  >
                    <div className="w-10 h-14 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          width={40}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.media_type === "movie" ? (
                            <Film size={16} className="text-gray-500" />
                          ) : (
                            <Book size={16} className="text-gray-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.media_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock size={32} />}
                message="Your watchlist is empty"
                action={{ label: "Browse Movies", href: "/movies" }}
              />
            )}
          </div>

          {/* Favorites */}
          <div className="bg-[#1E1E2E] rounded-xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={20} className="text-pink-400" />
              <h2 className="text-lg font-semibold">Favorites</h2>
            </div>

            {loading ? (
              <LoadingSkeleton count={3} />
            ) : favorites.length > 0 ? (
              <div className="space-y-3">
                {favorites.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 bg-[#2a2d3a] rounded-lg"
                  >
                    <div className="w-10 h-14 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          width={40}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.media_type === "movie" ? (
                            <Film size={16} className="text-gray-500" />
                          ) : (
                            <Book size={16} className="text-gray-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{item.media_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Heart size={32} />}
                message="No favorites yet"
                action={{ label: "Browse Content", href: "/movies" }}
              />
            )}
          </div>

          {/* Reading List */}
          <div className="bg-[#1E1E2E] rounded-xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={20} className="text-green-400" />
              <h2 className="text-lg font-semibold">Reading List</h2>
            </div>

            {loading ? (
              <LoadingSkeleton count={3} />
            ) : readingList.length > 0 ? (
              <div className="space-y-3">
                {readingList.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 bg-[#2a2d3a] rounded-lg"
                  >
                    <div className="w-10 h-14 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          width={40}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Book size={16} className="text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 capitalize">Book</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen size={32} />}
                message="No books in reading list"
                action={{ label: "Browse Books", href: "/books" }}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// Loading Skeleton
const LoadingSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="p-3 bg-[#2a2d3a] rounded-lg animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-700 rounded w-1/2" />
      </div>
    ))}
  </div>
);

// Empty State
const EmptyState: React.FC<{
  icon: React.ReactNode;
  message: string;
  action: { label: string; href: string };
}> = ({ icon, message, action }) => (
  <div className="text-center py-8">
    <div className="text-gray-600 mb-3">{icon}</div>
    <p className="text-gray-500 text-sm mb-4">{message}</p>
    <Link
      href={action.href}
      className="text-sm text-[#58b8ff] hover:underline"
    >
      {action.label}
    </Link>
  </div>
);

export default ProfilePage;
