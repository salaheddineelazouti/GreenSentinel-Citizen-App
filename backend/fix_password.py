from app.core.security import get_password_hash
import psycopg2

# Générer un hash bcrypt valide pour le mot de passe
password = "password123"
hashed_password = get_password_hash(password)
print(f"Hashed password: {hashed_password}")

# Mettre à jour le mot de passe dans la base de données
try:
    conn = psycopg2.connect(
        host="db",
        database="greensentinel",
        user="postgres",
        password="postgres"
    )
    
    cursor = conn.cursor()
    
    # Mettre à jour l'utilisateur admin@greensentinel.dev
    cursor.execute(
        "UPDATE users SET hashed_password = %s WHERE email = %s",
        (hashed_password, "admin@greensentinel.dev")
    )
    
    conn.commit()
    print("Password updated successfully in the database")
    
    # Vérifier la mise à jour
    cursor.execute("SELECT email, hashed_password FROM users WHERE email = 'admin@greensentinel.dev'")
    user = cursor.fetchone()
    if user:
        print(f"User: {user[0]}, Hash: {user[1]}")
    else:
        print("User not found")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
