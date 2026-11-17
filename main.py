from flask import Flask, render_template, request,redirect, url_for, flash, session
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

app = Flask(__name__)
app.secret_key = "my_secret_key"

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="day_check")

# def login_required(route_function):
#     pass
    
#     @wraps(route_function)
#     def wrapper(*args, **kwargs):

#         if "user_email" not in session:
#             flash("Please login first.", "Error")
#             return redirect(url_for("login"))
#         return route_function(*args, **kwargs)
#     return wrapper

@app.route("/")
def landing_page():
    return render_template("landing_page.html")

@app.route("/signup")
def signup():        
    return render_template("signup.html")

@app.route("/submitsignup", methods=["GET","POST"])
def submit_signup():

    conn = None
    crsr = None

    try:
        conn = get_db_connection()
        crsr = conn.cursor()
        
        username = request.form.get("username", "").strip()
        date_of_birth = request.form.get("date_of_birth", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        if not username or not date_of_birth or not email or not password:
            flash("Please fill in all required fields.", "Error")
            return redirect(url_for("signup"))

        # Check whether the email already exists
        crsr.execute(
            "SELECT Email FROM users WHERE Email = %s",
            (email,)
        )

        if crsr.fetchone():
            flash("This email is already registered.", "Error")
            return redirect(url_for("signup"))

        # Hash the password before saving it
        hashed_password = generate_password_hash(password)

        query = """
            INSERT INTO users (Username, DOB, Email, Password)
            VALUES (%s, %s, %s, %s)
        """

        crsr.execute(
            query,
            (username, date_of_birth, email, hashed_password)
        )

        conn.commit()

        flash("Registration successful. Please login.", "Success")
        return redirect(url_for("login"))

    except Exception as ex:
        print("Registration Error:", ex)

        if conn:
            conn.rollback()

        flash("Registration failed. Please check the details and try again.", "Error")
        return redirect(url_for("signup"))

    finally:
        if crsr:
            crsr.close()

        if conn and conn.is_connected():
            conn.close()

@app.route("/login")
def login():
    
    # If the user is already logged in, open the profile
    if "user_email" in session:
        return redirect(url_for("profile"))

    return render_template("login.html")

# @app.route("/submitlogin", methods=["GET","POST"])
# def submit_login():

#     conn = None
#     crsr = None

#     try:        
#         conn = get_db_connection()
#         crsr = conn.cursor(dictionary=True)
        
#         email = request.form.get("email", "").strip().lower()
#         password = request.form.get("password", "")

#         if not email or not password:
#             flash("Please enter your email and password.", "Error")
#             return redirect(url_for("login"))

#         query = """
#             SELECT Username, DOB, Email, Password
#             FROM users
#             WHERE Email = %s
#         """

#         crsr.execute(query, (email,))
#         user = crsr.fetchone()

#         if not user:
#             flash("Account not found. Please sign up first.", "Error")
#             return redirect(url_for("login"))

#         db_password = user["Password"]

#         if db_password is None:
#             password_valid = False

#         else:
#             # Check passwords created using the current secure signup code
#             try:
#                 password_valid = check_password_hash(db_password, password)
#             except (ValueError, TypeError):
#                 password_valid = False

#             # Support older accounts that stored plain-text passwords.
#             # Upgrade the password to a secure hash after successful login.
#             if not password_valid and db_password == password:

#                 new_hash = generate_password_hash(password)

#                 crsr.execute(
#                     """
#                     UPDATE users
#                     SET Password = %s
#                     WHERE Email = %s
#                     """,
#                     (new_hash, email)
#                 )

#                 conn.commit()
#                 password_valid = True

#         if not password_valid:
#             flash("Incorrect email or password.", "Error")
#             return redirect(url_for("login"))

#         # Login successful: create the session
#         session.clear()
#         session["user_email"] = user["Email"]

#         flash("Login successful!", "Success")

#         # Redirect to profile page
#         return redirect(url_for("profile"))

#     except Exception as ex:
#         print("Login Error:", repr(ex))

#         flash("An error occurred during login. Check the terminal for details.", "Error")
#         return redirect(url_for("login"))

#     finally:
#         if crsr:
#             crsr.close()

#         if conn and conn.is_connected():
#             conn.close()

# @app.route("/submitlogin", methods=["POST"])
# def submit_login():

#     conn = None
#     crsr = None

#     try:
#         conn = get_db_connection()
#         crsr = conn.cursor(dictionary=True)

#         email = request.form.get("email", "").strip().lower()
#         password = request.form.get("password", "")

#         # Validate input
#         if not email or not password:
#             flash("Please enter your email and password.", "Error")
#             return redirect(url_for("login"))

#         # Find user
#         query = """
#             SELECT Username, DOB, Email, Password
#             FROM users
#             WHERE LOWER(Email) = %s
#         """

#         crsr.execute(query, (email,))
#         user = crsr.fetchone()

#         if not user:
#             flash("Account not found. Please sign up first.", "Error")
#             return redirect(url_for("login"))

#         db_password = user["Password"]

#         # Verify password
#         password_valid = False

#         if db_password:

#             try:
#                 password_valid = check_password_hash(
#                     db_password, password
#                 )
#             except (ValueError, TypeError):
#                 password_valid = False

#             # Support older plain-text passwords
#             if not password_valid and db_password == password:

#                 new_hash = generate_password_hash(password)

#                 crsr.execute(
#                     """
#                     UPDATE users
#                     SET Password = %s
#                     WHERE Email = %s
#                     """,
#                     (new_hash, user["Email"])
#                 )

#                 conn.commit()
#                 password_valid = True

#         if not password_valid:
#             flash("Incorrect email or password.", "Error")
#             return redirect(url_for("login"))

#         # Close database resources before redirecting
#         crsr.close()
#         crsr = None

#         conn.close()
#         conn = None

#         # Create login session
#         session.clear()
#         session["user_email"] = user["Email"]

#         session.permanent = True

#         flash("Login successful!", "Success")

#         return redirect(url_for("profile"))

#     except Exception as ex:

#         print("Login Error:", repr(ex))

#         flash(
#             "An error occurred during login. Check the terminal for details.",
#             "Error"
#         )

#         return redirect(url_for("login"))

#     finally:

#         if crsr:
#             crsr.close()

#         if conn and conn.is_connected():
#             conn.close()

@app.route("/submitlogin", methods=["GET","POST"])
def submit_login():

    # Get email and password from HTML form
    email = request.form.get("email")
    password = request.form.get("password")

    # Temporary login verification
    if email and password:

        # Redirect to profile page
        return redirect(url_for("profile"))

    else:
        return "Please enter Email and Password"

@app.route("/dashboard")
# @login_required
def dashboard():

    conn = None
    crsr = None

    try:
        conn = get_db_connection()
        crsr = conn.cursor(dictionary=True)

        crsr.execute(
            """
            SELECT Username
            FROM users
            WHERE Email = %s
            """,
            (session["user_email"],)
        )

        user = crsr.fetchone()

        if not user:
            session.clear()
            flash("User account not found. Please login again.", "Error")
            return redirect(url_for("login"))

        return render_template(
            "dashboard.html",
            username=user["Username"],
            dashboard_data={}
        )

    except Exception as ex:
        print("Dashboard Error:", repr(ex))
        flash("Unable to load dashboard.", "Error")
        return redirect(url_for("login"))

    finally:
        if crsr:
            crsr.close()

        if conn and conn.is_connected():
            conn.close()

    return render_template(
        "dashboard.html",
        username="Vkky",
        dashboard_data=dashboard_data
    )


@app.route("/profile")
# @login_required
def profile():

    conn = None
    crsr = None

    try:
        conn = get_db_connection()
        crsr = conn.cursor(dictionary=True)

        crsr.execute(
            """
            SELECT Username, DOB, Email
            FROM users
            WHERE Email = %s
            """,
            (session["user_email"],)
        )

        user = crsr.fetchone()

        if not user:
            session.clear()
            flash("User account not found. Please login again.", "Error")
            return redirect(url_for("login"))

        return render_template(
            "profile.html",
            user=user
        )

    except Exception as ex:
        print("Profile Error:", repr(ex))
        flash("Unable to load profile. Check the terminal for details.", "Error")
        return redirect(url_for("login"))

    finally:
        if crsr:
            crsr.close()

        if conn and conn.is_connected():
            conn.close()
    
    conn = None
    crsr = None

    try:
        conn = get_db_connection()
        crsr = conn.cursor(dictionary=True)

        # Temporarily load the first registered user
        crsr.execute("""
            SELECT Username, DOB, Email
            FROM users
            LIMIT 1
        """)

        user = crsr.fetchone()

        if not user:
            flash("No user registered yet. Please sign up first.", "Error")
            return redirect(url_for("signup"))

        return render_template("profile.html", user=user)

    except Exception as ex:
        print("Profile Error:", repr(ex))
        flash("Unable to load profile.", "Error")
        return redirect(url_for("login"))

    finally:
        if crsr:
            crsr.close()

        if conn and conn.is_connected():
            conn.close()

@app.route("/records_reports")
# @login_required
def records_reports():
    return render_template("records_reports.html")

@app.route("/logout")
def logout():
    session.clear()
    flash("You have successfully logged out.", "Success")
    return redirect(url_for("login"))

if __name__ == "__main__":
    app.run(debug=True)