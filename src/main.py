from flask import Flask, render_template, request, redirect, url_for, session, flash
import os
from models import db, User
from argon2 import PasswordHasher

ph = PasswordHasher()

curr_dir = os.path.dirname(os.path.abspath(__file__))
template_path = os.path.join(curr_dir, "..", "templates")

app = Flask(__name__, template_folder=template_path)
app.secret_key = os.environ.get('SECRET_KEY', 'fallback-dev-key')
app.static_folder = os.path.join(os.path.dirname(__file__), '..', 'static')

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URL',
    'sqlite:///' + os.path.join(curr_dir, 'users.db')
)

db.init_app(app)
with app.app_context():
    db.create_all()

@app.route("/")
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    username = session['username']
    return render_template('index.html', username=username)

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form['username']
        password = request.form['password']

        if username == "admin" and password == "password":
            session['user_id'] = 1
            session['username'] = username
            flash("Login successful!", "success")
            return redirect(url_for('index'))
        else:
            flash("Invalid credentials. Please try again.", "danger")

    return render_template('login.html')

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form["username"]
        email = request.form["email"]
        password = request.form["password"]
        confirm_password = request.form["confirm_password"]

        if password != confirm_password:
            return render_template("register.html", error="Passwords Do Not Match")
        if User.query.filter_by(username=username).first():
            return render_template("register.html", error="Username Already Exists")
        if User.query.filter_by(email=email).first():
            return render_template("register.html", error="Email Already in Use")
        
        password_hash = ph.hash(password)
        user = User(username=username, email=email, password_hash=password_hash)
        db.session.add(user)
        db.session.commit()

        return redirect(url_for('login'))

    return render_template("register.html")

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route("/flashcards")
def flashcards():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    username = session['username']
    return render_template('flashcards.html', username=username)

@app.route("/quiz")
def quiz():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    username = session['username']
    return render_template('quiz.html', username=username)

if __name__ == "__main__":
    app.run(debug=True)