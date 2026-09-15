import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("backend/.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

ingredients = supabase.table("ingredients").select("*").limit(1).execute()
print("Ingredients:", ingredients.data)
if ingredients.data:
    item_id = ingredients.data[0]["id"]
    try:
        res = supabase.table("ingredients").delete().eq("id", item_id).execute()
        print("Delete result:", res.data)
    except Exception as e:
        print("Exception:", e)
