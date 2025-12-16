// helper funcs for fetching

// Remove trailing slash from API URL to prevent double-slash issues
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
export const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ============ TRENDING ENDPOINTS ============
export async function getTrendingMovies() {
  const res = await fetch(`${API_URL}/api/trending/movies`);
  if (!res.ok) {
    throw new Error(`Failed to fetch trending movies: ${res.status}`);
  }
  const data = await res.json();
  return data.results || [];
}

export async function getTrendingShows() {
  const res = await fetch(`${API_URL}/api/trending/shows`);
  if (!res.ok) {
    throw new Error(`Failed to fetch trending shows: ${res.status}`);
  }
  const data = await res.json();
  return data.results || [];
}

export async function getTrendingBooks() {
  const res = await fetch(`${API_URL}/api/trending/books`);
  if (!res.ok) {
    throw new Error(`Failed to fetch trending books: ${res.status}`);
  }
  const data = await res.json();
  return data.results || [];
}

// ============ USER ENDPOINTS (require auth token) ============
export async function getUserProfile(token: string) {
  const res = await fetch(`${API_URL}/api/user/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch profile: ${res.status}`);
  }
  return res.json();
}

export async function updateUserProfile(token: string, profile: { username?: string; avatar_url?: string }) {
  const res = await fetch(`${API_URL}/api/user/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    throw new Error(`Failed to update profile: ${res.status}`);
  }
  return res.json();
}

export async function getUserReviews(token: string) {
  const res = await fetch(`${API_URL}/api/user/reviews`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch reviews: ${res.status}`);
  }
  const data = await res.json();
  return data.reviews || [];
}

export async function createReview(token: string, review: {
  media_type: string;
  media_id: string;
  rating: number;
  review_text?: string;
}) {
  const res = await fetch(`${API_URL}/api/user/reviews`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(review),
  });
  if (!res.ok) {
    throw new Error(`Failed to create review: ${res.status}`);
  }
  return res.json();
}

export async function getUserLists(token: string, listType?: string) {
  const url = listType 
    ? `${API_URL}/api/user/lists?list_type=${listType}`
    : `${API_URL}/api/user/lists`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch lists: ${res.status}`);
  }
  const data = await res.json();
  return data.items || [];
}

export async function addToList(token: string, item: {
  list_type: string;
  media_type: string;
  media_id: string;
  title: string;
  image_url?: string;
}) {
  const res = await fetch(`${API_URL}/api/user/lists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    throw new Error(`Failed to add to list: ${res.status}`);
  }
  return res.json();
}

export async function removeFromList(token: string, itemId: string) {
  const res = await fetch(`${API_URL}/api/user/lists/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to remove from list: ${res.status}`);
  }
  return res.json();
}

export async function getUserStats(token: string) {
  const res = await fetch(`${API_URL}/api/user/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.status}`);
  }
  return res.json();
}

// ============ LEGACY - Keep for compatibility ============
export async function getMovies() {
  const res = await fetch(`${API_URL}/api/recs`);
  if (!res.ok) {
    throw new Error(`Failed to fetch movies: ${res.status}`);
  }

  const data = await res.json(); 
  console.log("movies value:", data.movies);
  console.log("movies type:", typeof data.movies);
  const raw = data.movies; 

  const cleaned = raw
    .replace(/```json\s*/i, "") 
    .replace(/```$/i, "");      

  const movies = JSON.parse(cleaned);

  console.log("parsed movies:", movies);
  console.log(movies[0].title);

  return movies;
}

export default fetcher;
