from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import os
import pickle
import numpy as np
import cv2
import mediapipe as mp
import base64
from datetime import datetime, timezone, timedelta
from src.src.models import db, User
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
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=10)

db.init_app(app)
with app.app_context():
    db.create_all()

# Load model once at startup
model_dict = pickle.load(open(os.path.join(curr_dir, 'model.p'), 'rb'))
model = model_dict['model']

# MediaPipe setup
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, min_detection_confidence=0.3)

LABELS_DICT = {i: chr(65 + i) for i in range(26)}  # {0: 'A', 1: 'B', ...}

@app.before_request
def check_session_timeout():
    if 'user_id' in session:
        last_active = session.get('last_active')
        if last_active:
            last_active_time = datetime.fromisoformat(last_active)
            if datetime.now(timezone.utc) - last_active_time > timedelta(minutes=10):
                session.clear()
                flash('Session expired due to inactivity.', 'warning')
                return redirect(url_for('login'))
        session['last_active'] = datetime.now(timezone.utc).isoformat()

@app.route('/check_session')
def check_session():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify({'status': 'ok'})

@app.route("/")
def index():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    username = session['username']
    user = db.session.get(User, session['user_id'])
    correct_answers = user.correct_answers if user else 0
    print(f"[{username}] correct_answers: {correct_answers}")

    if correct_answers < 10:
        rank = "Beginner"
    elif correct_answers < 20:
        rank = "Apprentice"
    elif correct_answers < 30:
        rank = "Master"
    elif correct_answers < 50:
        rank = "Expert"
    else:
        rank = "Guru"

    return render_template('index.html', username=username, rank=rank)


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form['username']
        password = request.form['password']

        user = User.query.filter_by(username=username).first()
        if user:
            try:
                ph.verify(user.password_hash, password)
                session['user_id'] = user.id
                session['username'] = user.username
                flash("Login successful!", "success")
                return redirect(url_for('index'))
            except Exception:
                flash("Invalid credentials. Please try again.", "danger")
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


@app.route('/predict', methods=['POST'])
def predict():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    image_data = data['image']
    expected = data['expected']

    # Decode base64 image
    header, encoded = image_data.split(',', 1)
    img_bytes = base64.b64decode(encoded)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    results = hands.process(frame_rgb)

    if not results.multi_hand_landmarks:
        return jsonify({'predicted': '?', 'correct': False, 'error': 'No hand detected'})

    hand_landmarks = results.multi_hand_landmarks[0]

    data_aux = []
    x_ = [lm.x for lm in hand_landmarks.landmark]
    y_ = [lm.y for lm in hand_landmarks.landmark]

    for lm in hand_landmarks.landmark:
        data_aux.append(lm.x - min(x_))
        data_aux.append(lm.y - min(y_))

    prediction = model.predict([np.asarray(data_aux)])
    predicted_label = prediction[0]

    try:
        predicted_char = LABELS_DICT[int(predicted_label)]
    except (ValueError, KeyError):
        predicted_char = str(predicted_label).upper()

    is_correct = (predicted_char == expected.upper())

    if is_correct:
        user = db.session.get(User, session['user_id'])
        if user:
            user.correct_answers += 1
            db.session.commit()    

    return jsonify({'predicted': predicted_char, 'correct': is_correct})


if __name__ == "__main__":
    app.run(debug=True)