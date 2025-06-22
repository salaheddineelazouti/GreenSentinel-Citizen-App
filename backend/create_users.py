"""
Script simple pour créer les utilisateurs de démonstration dans la base de données GreenSentinel.
Ce script est une version allégée du script seed_demo.py pour se concentrer uniquement sur la création des utilisateurs.
"""

import asyncio
import sqlite3
from pathlib import Path

# Chemin vers la base de données SQLite
db_path = Path(__file__).parent / "greensentinel.db"

# Fonction pour hacher un mot de passe
def get_password_hash(password: str) -> str:
    # Version simplifiée - dans un vrai cas, utilisez bcrypt ou un algorithme sécurisé
    # Ceci est juste pour la démo
    import hashlib
    return hashlib.sha256(password.encode()).hexdigest()

async def create_users():
    """Crée les utilisateurs de démonstration dans la base de données SQLite."""
    print(f"Création des utilisateurs de démonstration dans {db_path}...")
    
    # Vérifier si la BD existe, sinon la créer
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Vérifier si la table users existe
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        print("Création de la table users...")
        cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            hashed_password TEXT,
            is_active BOOLEAN
        )
        ''')
    
    # Vérifier si l'utilisateur existe déjà
    cursor.execute("SELECT id FROM users WHERE email = ?", ("firefighter@example.com",))
    if cursor.fetchone():
        print("Les utilisateurs de démonstration existent déjà.")
        conn.close()
        return
    
    # Créer les utilisateurs de démonstration
    users = [
        ("citizen@example.com", get_password_hash("pwd123")),
        ("firefighter@example.com", get_password_hash("pwd123")),
        ("admin@example.com", get_password_hash("admin123"))
    ]
    
    for email, pwd_hash in users:
        cursor.execute(
            "INSERT INTO users (email, hashed_password, is_active) VALUES (?, ?, ?)",
            (email, pwd_hash, True)
        )
    
    conn.commit()
    conn.close()
    print("✅ Utilisateurs de démonstration créés avec succès !")

if __name__ == "__main__":
    asyncio.run(create_users())
    print("Vous pouvez maintenant vous connecter avec : firefighter@example.com / pwd123")
