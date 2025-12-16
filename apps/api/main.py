from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
from openai import OpenAI
import os
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client
import httpx
from datetime import datetime, timedelta
from jose import jwt

# Load environment variables
load_dotenv(dotenv_path=".env.local")

# API Keys and clients
api_key = os.getenv("OPENAI_API_KEY")
openai_client = OpenAI(api_key=api_key) if api_key else None

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

# Initialize Supabase client
supabase: Client = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ CACHING LAYER ============
class Cache:
    def __init__(self, ttl_hours: int = 1):
        self._cache = {}
        self._ttl = timedelta(hours=ttl_hours)
    
    def get(self, key: str):
        if key in self._cache:
            data, timestamp = self._cache[key]
            if datetime.now() - timestamp < self._ttl:
                return data
            del self._cache[key]
        return None
    
    def set(self, key: str, value):
        self._cache[key] = (value, datetime.now())

cache = Cache(ttl_hours=1)

# ============ PYDANTIC MODELS ============
class Movie(BaseModel):
    title: str
    rating: int

class MovieRecs(BaseModel):
    movies: List[Movie]

class UserProfile(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None

class Review(BaseModel):
    media_type: str  # 'movie' or 'book'
    media_id: str
    rating: int
    review_text: Optional[str] = None

class ListItem(BaseModel):
    list_type: str  # 'watchlist', 'favorites', 'reading_list'
    media_type: str  # 'movie' or 'book'
    media_id: str
    title: str
    image_url: Optional[str] = None

# ============ AUTH MIDDLEWARE ============
async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        # Verify JWT with Supabase
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(authorization: Optional[str] = Header(None)):
    """Get user if authenticated, otherwise return None"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        # Expected when user is not authenticated or token is invalid
        return None
    except Exception as e:
        # Log unexpected errors but don't crash - user just won't be authenticated
        print(f"Unexpected auth error in get_optional_user: {e}")
        return None

# ============ EXISTING OPENAI RECOMMENDATION ENDPOINT ============
movie_result_json = None

async def get_openai_recommendation(movies: List[Movie]):
    if not openai_client:
        return "OpenAI API key not configured. Please add your API key to apps/api/.env.local"
    
    movie_list = ", ".join([f"{movie.title} (rated {movie.rating}/10)" for movie in movies])
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a movie recommendation expert. And you will only respond with what I ask. Nothing more, nothing less"},
                {"role": "user", "content": f"Given the following movies and my ratings, recommend me a new movie to watch. The movies are: {movie_list}. Give me a list of movies and explain why the user will enjoy it in a sentence. Do not wrap the title in *" }
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"An error occurred: {e}")
        return "I am having trouble getting a recommendation for you right now."

@app.post("/api/recs")
async def get_recommendations(movie_recs: MovieRecs):
    try:
        recommendation_json = await get_openai_recommendation(movie_recs.movies)
        
        global movie_result_json
        movie_result_json = recommendation_json
        print(recommendation_json)
        return {"recommendation": recommendation_json}

    except Exception as err:
        print(err)
        return {"error": "Something went wrong with API recommendation request."}

# ============ TRENDING ENDPOINTS ============
@app.get("/api/trending/movies")
async def get_trending_movies():
    """Fetch trending movies from TMDB API with caching"""
    cached = cache.get("trending_movies")
    if cached:
        return cached
    
    if not TMDB_API_KEY:
        # Return mock data if no API key
        mock_data = {
            "results": [
                {"id": 1, "title": "The Batman", "poster_path": "/images/thebatman.jpg", "release_date": "2022-03-01", "vote_average": 7.8},
                {"id": 2, "title": "Spider-Man: Homecoming", "poster_path": "/images/spiderman_homecoming.jpg", "release_date": "2017-07-05", "vote_average": 7.4},
                {"id": 3, "title": "Aquaman and the Lost Kingdom", "poster_path": "/images/aquaman_lost_kingdom.jpg", "release_date": "2023-12-20", "vote_average": 6.5},
            ]
        }
        return mock_data
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.themoviedb.org/3/trending/movie/week",
                params={"api_key": TMDB_API_KEY}
            )
            response.raise_for_status()
            data = response.json()
            
            # Transform the data
            movies = []
            for movie in data.get("results", [])[:12]:
                movies.append({
                    "id": movie["id"],
                    "title": movie["title"],
                    "poster_path": f"https://image.tmdb.org/t/p/w500{movie['poster_path']}" if movie.get("poster_path") else None,
                    "release_date": movie.get("release_date"),
                    "vote_average": movie.get("vote_average"),
                    "overview": movie.get("overview", "")[:150]
                })
            
            result = {"results": movies}
            cache.set("trending_movies", result)
            return result
    except Exception as e:
        print(f"TMDB API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch trending movies")

@app.get("/api/trending/shows")
async def get_trending_shows():
    """Fetch trending TV shows from TMDB API with caching"""
    cached = cache.get("trending_shows")
    if cached:
        return cached
    
    if not TMDB_API_KEY:
        mock_data = {
            "results": [
                {"id": 1, "name": "Arcane", "poster_path": "/images/arcane.jpg", "first_air_date": "2021-11-06", "vote_average": 9.0},
            ]
        }
        return mock_data
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.themoviedb.org/3/trending/tv/week",
                params={"api_key": TMDB_API_KEY}
            )
            response.raise_for_status()
            data = response.json()
            
            shows = []
            for show in data.get("results", [])[:12]:
                shows.append({
                    "id": show["id"],
                    "title": show["name"],
                    "poster_path": f"https://image.tmdb.org/t/p/w500{show['poster_path']}" if show.get("poster_path") else None,
                    "release_date": show.get("first_air_date"),
                    "vote_average": show.get("vote_average"),
                    "overview": show.get("overview", "")[:150]
                })
            
            result = {"results": shows}
            cache.set("trending_shows", result)
            return result
    except Exception as e:
        print(f"TMDB API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch trending shows")

@app.get("/api/movie/{movie_id}")
async def get_movie_details(movie_id: int):
    """Fetch movie details from TMDB API"""
    cache_key = f"movie_{movie_id}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    if not TMDB_API_KEY:
        raise HTTPException(status_code=500, detail="TMDB API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            # Fetch movie details
            response = await client.get(
                f"https://api.themoviedb.org/3/movie/{movie_id}",
                params={"api_key": TMDB_API_KEY, "append_to_response": "credits,videos"}
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract cast (top 10)
            cast = []
            for person in data.get("credits", {}).get("cast", [])[:10]:
                cast.append({
                    "id": person["id"],
                    "name": person["name"],
                    "character": person.get("character"),
                    "profile_path": f"https://image.tmdb.org/t/p/w185{person['profile_path']}" if person.get("profile_path") else None
                })
            
            # Extract director
            director = None
            for person in data.get("credits", {}).get("crew", []):
                if person.get("job") == "Director":
                    director = person["name"]
                    break
            
            # Extract trailer
            trailer = None
            for video in data.get("videos", {}).get("results", []):
                if video.get("type") == "Trailer" and video.get("site") == "YouTube":
                    trailer = f"https://www.youtube.com/watch?v={video['key']}"
                    break
            
            result = {
                "id": data["id"],
                "title": data["title"],
                "overview": data.get("overview"),
                "poster_path": f"https://image.tmdb.org/t/p/w500{data['poster_path']}" if data.get("poster_path") else None,
                "backdrop_path": f"https://image.tmdb.org/t/p/original{data['backdrop_path']}" if data.get("backdrop_path") else None,
                "release_date": data.get("release_date"),
                "runtime": data.get("runtime"),
                "vote_average": data.get("vote_average"),
                "vote_count": data.get("vote_count"),
                "genres": [g["name"] for g in data.get("genres", [])],
                "tagline": data.get("tagline"),
                "status": data.get("status"),
                "budget": data.get("budget"),
                "revenue": data.get("revenue"),
                "director": director,
                "cast": cast,
                "trailer": trailer,
                "media_type": "movie"
            }
            
            cache.set(cache_key, result)
            return result
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="Movie not found")
        raise HTTPException(status_code=500, detail="Failed to fetch movie details")
    except Exception as e:
        print(f"TMDB API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch movie details")

@app.get("/api/tv/{show_id}")
async def get_tv_details(show_id: int):
    """Fetch TV show details from TMDB API"""
    cache_key = f"tv_{show_id}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    if not TMDB_API_KEY:
        raise HTTPException(status_code=500, detail="TMDB API key not configured")
    
    try:
        async with httpx.AsyncClient() as client:
            # Fetch TV show details
            response = await client.get(
                f"https://api.themoviedb.org/3/tv/{show_id}",
                params={"api_key": TMDB_API_KEY, "append_to_response": "credits,videos"}
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract cast (top 10)
            cast = []
            for person in data.get("credits", {}).get("cast", [])[:10]:
                cast.append({
                    "id": person["id"],
                    "name": person["name"],
                    "character": person.get("character"),
                    "profile_path": f"https://image.tmdb.org/t/p/w185{person['profile_path']}" if person.get("profile_path") else None
                })
            
            # Extract creator
            creators = [c["name"] for c in data.get("created_by", [])]
            
            # Extract trailer
            trailer = None
            for video in data.get("videos", {}).get("results", []):
                if video.get("type") == "Trailer" and video.get("site") == "YouTube":
                    trailer = f"https://www.youtube.com/watch?v={video['key']}"
                    break
            
            result = {
                "id": data["id"],
                "title": data["name"],
                "overview": data.get("overview"),
                "poster_path": f"https://image.tmdb.org/t/p/w500{data['poster_path']}" if data.get("poster_path") else None,
                "backdrop_path": f"https://image.tmdb.org/t/p/original{data['backdrop_path']}" if data.get("backdrop_path") else None,
                "first_air_date": data.get("first_air_date"),
                "last_air_date": data.get("last_air_date"),
                "number_of_seasons": data.get("number_of_seasons"),
                "number_of_episodes": data.get("number_of_episodes"),
                "episode_run_time": data.get("episode_run_time", [None])[0] if data.get("episode_run_time") else None,
                "vote_average": data.get("vote_average"),
                "vote_count": data.get("vote_count"),
                "genres": [g["name"] for g in data.get("genres", [])],
                "tagline": data.get("tagline"),
                "status": data.get("status"),
                "creators": creators,
                "cast": cast,
                "trailer": trailer,
                "media_type": "tv"
            }
            
            cache.set(cache_key, result)
            return result
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="TV show not found")
        raise HTTPException(status_code=500, detail="Failed to fetch TV show details")
    except Exception as e:
        print(f"TMDB API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch TV show details")

@app.get("/api/book/{book_id}")
async def get_book_details(book_id: str):
    """Fetch book details from Open Library API"""
    cache_key = f"book_{book_id}"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    try:
        async with httpx.AsyncClient() as client:
            # Fetch book details from Open Library
            response = await client.get(
                f"https://openlibrary.org/works/{book_id}.json"
            )
            response.raise_for_status()
            data = response.json()
            
            # Get author details
            authors = []
            for author_ref in data.get("authors", []):
                author_key = author_ref.get("author", {}).get("key", "")
                if author_key:
                    try:
                        author_response = await client.get(
                            f"https://openlibrary.org{author_key}.json"
                        )
                        if author_response.status_code == 200:
                            author_data = author_response.json()
                            authors.append({
                                "name": author_data.get("name"),
                                "bio": author_data.get("bio", {}).get("value") if isinstance(author_data.get("bio"), dict) else author_data.get("bio"),
                                "photo": f"https://covers.openlibrary.org/a/olid/{author_key.split('/')[-1]}-M.jpg"
                            })
                    except (httpx.RequestError, httpx.HTTPStatusError) as e:
                        # Network or HTTP errors - skip this author but continue with others
                        print(f"Failed to fetch author {author_key}: {e}")
                    except (KeyError, TypeError, ValueError) as e:
                        # Data parsing errors - skip this author but continue with others
                        print(f"Failed to parse author data for {author_key}: {e}")
            
            # Get cover
            cover_id = None
            if data.get("covers"):
                cover_id = data["covers"][0]
            
            # Get description
            description = data.get("description")
            if isinstance(description, dict):
                description = description.get("value", "")
            
            # Get subjects/genres
            subjects = data.get("subjects", [])[:10] if data.get("subjects") else []
            
            # Try to get edition info for more details
            first_publish_year = data.get("first_publish_date", "").split()[-1] if data.get("first_publish_date") else None
            
            result = {
                "id": book_id,
                "title": data.get("title"),
                "description": description,
                "cover_url": f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else None,
                "cover_url_large": f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else None,
                "authors": authors,
                "subjects": subjects,
                "first_publish_year": first_publish_year,
                "revision": data.get("revision"),
                "media_type": "book"
            }
            
            cache.set(cache_key, result)
            return result
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="Book not found")
        raise HTTPException(status_code=500, detail="Failed to fetch book details")
    except Exception as e:
        print(f"Open Library API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch book details")

@app.get("/api/trending/books")
async def get_trending_books():
    """Fetch trending/popular books from Open Library API with caching"""
    cached = cache.get("trending_books")
    if cached:
        return cached
    
    try:
        async with httpx.AsyncClient() as client:
            # Open Library trending/popular books
            response = await client.get(
                "https://openlibrary.org/trending/daily.json",
                params={"limit": 12}
            )
            response.raise_for_status()
            data = response.json()
            
            books = []
            for work in data.get("works", [])[:12]:
                cover_id = work.get("cover_i")
                books.append({
                    "id": work.get("key", "").replace("/works/", ""),
                    "title": work.get("title"),
                    "author": work.get("author_name", ["Unknown"])[0] if work.get("author_name") else "Unknown",
                    "cover_url": f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else None,
                    "first_publish_year": work.get("first_publish_year"),
                })
            
            result = {"results": books}
            cache.set("trending_books", result)
            return result
    except Exception as e:
        print(f"Open Library API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch trending books")

# ============ USER PROFILE ENDPOINTS ============
@app.get("/api/user/profile")
async def get_user_profile(user = Depends(get_current_user)):
    """Get the authenticated user's profile"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        # Get profile from profiles table
        result = supabase.table("profiles").select("*").eq("id", user.id).single().execute()
        
        if result.data:
            return {
                "id": user.id,
                "email": user.email,
                "username": result.data.get("username"),
                "avatar_url": result.data.get("avatar_url"),
                "created_at": result.data.get("created_at")
            }
        else:
            # Create profile if doesn't exist
            new_profile = {
                "id": user.id,
                "username": user.email.split("@")[0],
                "created_at": datetime.now().isoformat()
            }
            supabase.table("profiles").insert(new_profile).execute()
            return {
                "id": user.id,
                "email": user.email,
                "username": new_profile["username"],
                "avatar_url": None,
                "created_at": new_profile["created_at"]
            }
    except Exception as e:
        print(f"Profile fetch error: {e}")
        # Return basic user info if profile table doesn't exist
        return {
            "id": user.id,
            "email": user.email,
            "username": user.email.split("@")[0] if user.email else "User",
            "avatar_url": None
        }

@app.put("/api/user/profile")
async def update_user_profile(profile: UserProfile, user = Depends(get_current_user)):
    """Update the authenticated user's profile"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        update_data = {}
        if profile.username is not None:
            update_data["username"] = profile.username
        if profile.avatar_url is not None:
            update_data["avatar_url"] = profile.avatar_url
        
        if update_data:
            result = supabase.table("profiles").upsert({
                "id": user.id,
                **update_data
            }).execute()
        
        return {"message": "Profile updated successfully"}
    except Exception as e:
        print(f"Profile update error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

# ============ REVIEWS ENDPOINTS ============
@app.get("/api/user/reviews")
async def get_user_reviews(user = Depends(get_current_user)):
    """Get all reviews by the authenticated user"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        result = supabase.table("reviews").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
        return {"reviews": result.data or []}
    except Exception as e:
        print(f"Reviews fetch error: {e}")
        return {"reviews": []}

@app.post("/api/user/reviews")
async def create_review(review: Review, user = Depends(get_current_user)):
    """Create a new review"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        review_data = {
            "user_id": user.id,
            "media_type": review.media_type,
            "media_id": review.media_id,
            "rating": review.rating,
            "review_text": review.review_text,
            "created_at": datetime.now().isoformat()
        }
        
        result = supabase.table("reviews").insert(review_data).execute()
        return {"message": "Review created successfully", "review": result.data[0] if result.data else None}
    except Exception as e:
        print(f"Review creation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create review")

# ============ LISTS ENDPOINTS (Watchlist, Favorites, etc.) ============
@app.get("/api/user/lists")
async def get_user_lists(list_type: Optional[str] = None, user = Depends(get_current_user)):
    """Get user's lists (watchlist, favorites, etc.)"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        query = supabase.table("user_lists").select("*").eq("user_id", user.id)
        if list_type:
            query = query.eq("list_type", list_type)
        
        result = query.order("created_at", desc=True).execute()
        return {"items": result.data or []}
    except Exception as e:
        print(f"Lists fetch error: {e}")
        return {"items": []}

@app.post("/api/user/lists")
async def add_to_list(item: ListItem, user = Depends(get_current_user)):
    """Add an item to a user's list"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        list_data = {
            "user_id": user.id,
            "list_type": item.list_type,
            "media_type": item.media_type,
            "media_id": item.media_id,
            "title": item.title,
            "image_url": item.image_url,
            "created_at": datetime.now().isoformat()
        }
        
        result = supabase.table("user_lists").insert(list_data).execute()
        return {"message": "Item added to list", "item": result.data[0] if result.data else None}
    except Exception as e:
        print(f"List add error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add item to list")

@app.delete("/api/user/lists/{item_id}")
async def remove_from_list(item_id: str, user = Depends(get_current_user)):
    """Remove an item from a user's list"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        supabase.table("user_lists").delete().eq("id", item_id).eq("user_id", user.id).execute()
        return {"message": "Item removed from list"}
    except Exception as e:
        print(f"List remove error: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove item from list")

# ============ USER STATS ENDPOINT ============
@app.get("/api/user/stats")
async def get_user_stats(user = Depends(get_current_user)):
    """Get user statistics"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        # Count reviews
        reviews_result = supabase.table("reviews").select("id", count="exact").eq("user_id", user.id).execute()
        reviews_count = reviews_result.count or 0
        
        # Count movies in lists
        movies_result = supabase.table("user_lists").select("id", count="exact").eq("user_id", user.id).eq("media_type", "movie").execute()
        movies_count = movies_result.count or 0
        
        # Count books in lists
        books_result = supabase.table("user_lists").select("id", count="exact").eq("user_id", user.id).eq("media_type", "book").execute()
        books_count = books_result.count or 0
        
        return {
            "total_reviews": reviews_count,
            "total_movies": movies_count,
            "total_books": books_count
        }
    except Exception as e:
        print(f"Stats fetch error: {e}")
        return {
            "total_reviews": 0,
            "total_movies": 0,
            "total_books": 0
        }

# ============ LEGACY ENDPOINT ============
@app.get("/items/{item_id}")
def read_item(item_id: int):
    return {"item_id": item_id, "description": "A test item"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
