from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
from openai import OpenAI
import os
from pydantic import BaseModel
from typing import List

load_dotenv(dotenv_path=".env.local")
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
movie_result_json = None

class Movie(BaseModel):
    title: str
    rating: int

class MovieRecs(BaseModel):
    movies: List[Movie]

async def get_openai_recommendation(movies: List[Movie]):
    movie_list = ", ".join([f"{movie.title} (rated {movie.rating}/10)" for movie in movies])
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a movie recommendation expert. And you will only respond with what I ask. Nothing more, nothing less"},
                {"role": "user", "content": f"Given the following movies and my ratings, recommend me a new movie to watch. The movies are: {movie_list}. Include the movies in the prompt in the output json file. Each movie must be a JSON object with the following keys: id, title, year, image, rating, and director. Respond ONLY with a JSON array."}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"An error occurred: {e}")
        return "I am having trouble getting a recommendation for you right now."

@app.post("/api/recs")
async def get_recommendations(movie_recs: MovieRecs):
    #print(1)
    try:
        recommendation_json = await get_openai_recommendation(movie_recs.movies)
        
        global movie_result_json
        movie_result_json = recommendation_json
        #print(recommendation_json)
        return {"recommendation": recommendation_json}

    except Exception as err:
        print(err)
        return {"error": "Something went wrong with API recommendation request."}

@app.get("/api/recs")
def get_recs():
    print(movie_result_json)
    return {"movies": movie_result_json}

@app.get("/items/{item_id}")
def read_item(item_id: int):
    return {"item_id": item_id, "description": "A test item"}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
