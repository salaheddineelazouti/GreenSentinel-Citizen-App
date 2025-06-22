"""
Script de vérification des utilisateurs de démonstration dans la base de données GreenSentinel.
"""

import sqlite3
from pathlib import Path

# Chemin vers la base de données SQLite
db_path = Path(__file__).parent / "greensentinel.db"

def verify_users():
    """Vérifie si les utilisateurs de démonstration existent dans la base de données."""
    print(f"Vérification des utilisateurs dans {db_path}...")
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Vérifier si la table users existe
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print("La table users n'existe pas!")
            return False
        
        # Compter les utilisateurs
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        print(f"Nombre total d'utilisateurs: {count}")
        
        # Lister les utilisateurs
        cursor.execute("SELECT id, email, is_active FROM users")
        users = cursor.fetchall()
        
        print("\nListe des utilisateurs:")
        print("-----------------------")
        for user_id, email, is_active in users:
            status = "Actif" if is_active else "Inactif"
            print(f"ID: {user_id}, Email: {email}, Statut: {status}")
        
        conn.close()
        
        # Vérifier si l'utilisateur pompier existe
        firefighter_exists = any(email == "firefighter@example.com" for _, email, _ in users)
        if firefighter_exists:
            print("\nL'utilisateur firefighter@example.com existe et peut être utilisé pour se connecter.")
            print("Mot de passe: pwd123")
        else:
            print("\nL'utilisateur firefighter@example.com n'existe PAS!")
        
        return True
    except Exception as e:
        print(f"Erreur lors de la vérification: {e}")
        return False

if __name__ == "__main__":
    verify_users()
