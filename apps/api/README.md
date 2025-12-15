How to run backend:  

1.cd apps/api  
2.python3 -m venv .venv  
3.source .venv/bin/activate  
4.pip install -r requirements.txt  
5.mkdir .env.local  
6.Put APIKEY=??? inside the environment file  
7.uvicorn main:app --reload  
