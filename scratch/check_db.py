from pymongo import MongoClient

def main():
    client = MongoClient("mongodb://127.0.0.1:27017/")
    db = client["seafood_db"]
    
    print("Collections in database:")
    for col in db.list_collection_names():
        print(f"  - {col}: {db[col].count_documents({})} documents")
        
    print("\nUsers:")
    for user in db["users"].find().limit(5):
        print(f"  - Name: {user.get('name')}, Email: {user.get('email')}, Role: {user.get('role')}")
        
    print("\nProducts:")
    for prod in db["products"].find().limit(5):
        print(f"  - Name: {prod.get('name')}, Price: {prod.get('price')}, Type: {prod.get('type')}")

if __name__ == "__main__":
    main()
