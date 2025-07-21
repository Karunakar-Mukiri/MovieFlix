from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import mysql.connector
from mysql.connector import pooling
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime, timedelta, time
from functools import wraps





app = Flask(__name__)
app.secret_key = os.urandom(24)

# --- Database Connection Pooling ---
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '@Karuna2000',  # 🔒 Change this in production
    'database': 'movie_db3'
}

try:
    cnxpool = pooling.MySQLConnectionPool(pool_name="movie_app_pool", pool_size=10, **db_config)
except mysql.connector.Error as err:
    print(f"Error creating connection pool: {err}")
    exit()

# --- Helper function for DB queries ---
def execute_query(query, params=None, fetch=None, dictionary=True):
    conn = cnxpool.get_connection()
    cursor = conn.cursor(dictionary=dictionary)
    try:
        cursor.execute(query, params or ())
        if fetch == 'one':
            return cursor.fetchone()
        elif fetch == 'all':
            return cursor.fetchall()
        else:
            conn.commit()
            return cursor.lastrowid or cursor.rowcount
    except mysql.connector.Error as err:
        print(f"Database Query Error: {err}")
        conn.rollback()
        return None
    finally:
        cursor.close()
        conn.close()

# --- Auth Decorators ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if session.get('role') != 'admin':
            return redirect(url_for('home'))
        return f(*args, **kwargs)
    return decorated_function

def user_required(f):
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if session.get('role') != 'user':
            return redirect(url_for('admin_dashboard'))
        return f(*args, **kwargs)
    return decorated_function

# --- Main Routes ---
@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('admin_dashboard' if session['role'] == 'admin' else 'home'))
    return redirect(url_for('login_page'))

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

# --- User Routes ---
@app.route('/home')
@user_required
def home():
    movies = execute_query("SELECT * FROM movies", fetch='all')
    return render_template('user/home.html', movies=movies or [])

@app.route('/book/<int:movie_id>')
@user_required
def book_movie_page(movie_id):
    movie = execute_query("SELECT * FROM movies WHERE id = %s", (movie_id,), fetch='one')
    if not movie:
        return "Movie not found", 404
    return render_template('user/booking.html', movie=movie)


@app.route('/ticket/<int:booking_id>')
@user_required
def ticket_page(booking_id):
    # This query is now more complete and fetches all necessary details for the ticket.
    query = """
    SELECT 
        b.id, b.seat_numbers, b.booking_time,
        s.show_date, 
        DATE_FORMAT(s.show_time, '%I:%i %p') AS show_time, 
        s.price, 
        s.theater_name,
        m.title, m.poster_url
    FROM bookings b
    JOIN showtimes s ON b.showtime_id = s.id
    JOIN movies m ON s.movie_id = m.id
    WHERE b.id = %s AND b.user_id = %s
    """
    ticket = execute_query(query, (booking_id, session['user_id']), fetch='one')
    
    if not ticket:
        return "Ticket not found or access denied.", 404
        
    return render_template('user/ticket.html', ticket=ticket)
# --- Admin Routes ---
@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    movies = execute_query("SELECT * FROM movies ORDER BY id DESC", fetch='all')
    return render_template('admin/admin_dashboard.html', movies=movies or [])

@app.route('/admin/manage_movie/<int:movie_id>')
@admin_required
def manage_movie_page(movie_id):
    movie = execute_query("SELECT * FROM movies WHERE id = %s", (movie_id,), fetch='one')
    showtimes = execute_query("SELECT * FROM showtimes WHERE movie_id = %s ORDER BY show_date, show_time", (movie_id,), fetch='all')

    # ✅ Fix for timedelta -> time so strftime works in Jinja
    for show in showtimes or []:
        if isinstance(show['show_time'], timedelta):
            seconds = int(show['show_time'].total_seconds())
            show['show_time'] = time(hour=seconds // 3600, minute=(seconds % 3600) // 60)

    if not movie:
        return "Movie not found", 404
    return render_template('admin/manage_movie.html', movie=movie, showtimes=showtimes or [])

@app.route('/admin/add_movie', methods=['POST'])
@admin_required
def add_movie():
    form = request.form
    execute_query(
        "INSERT INTO movies (title, plot, rating, duration_minutes, poster_url) VALUES (%s, %s, %s, %s, %s)",
        (form['title'], form['plot'], form['rating'], form['duration'], form['poster_url'])
    )
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/delete_movie/<int:movie_id>', methods=['POST'])
@admin_required
def delete_movie(movie_id):
    execute_query("DELETE FROM movies WHERE id = %s", (movie_id,))
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/add_showtime', methods=['POST'])
@admin_required
def add_showtime():
    form = request.form
    execute_query(
        "INSERT INTO showtimes (movie_id, theater_name, show_date, show_time, price) VALUES (%s, %s, %s, %s, %s)",
        (form['movie_id'], form['theater_name'], form['show_date'], form['show_time'], form['price'])
    )
    return redirect(url_for('manage_movie_page', movie_id=form['movie_id']))

# --- API Endpoints ---
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    role = data.get('role', 'user')
    user = execute_query("SELECT * FROM users WHERE email = %s AND role = %s", (data['email'], role), fetch='one')
    if user and check_password_hash(user['password_hash'], data['password']):
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({'success': True, 'role': user['role']})
    return jsonify({'success': False, 'message': 'Invalid credentials or role.'}), 401

@app.route('/api/signup', methods=['POST'])
def api_signup():
    data = request.get_json()
    hashed_password = generate_password_hash(data['password'])
    user_id = execute_query(
        "INSERT INTO users (username, email, password_hash, role) VALUES (%s, %s, %s, 'user')",
        (data['username'], data['email'], hashed_password)
    )
    if user_id:
        return jsonify({'success': True, 'message': 'User created successfully!'})
    return jsonify({'success': False, 'message': 'Email or username already exists.'}), 409

@app.route('/api/movies/<int:movie_id>/showtimes', methods=['GET'])
@login_required
def get_showtimes(movie_id):
    selected_date = request.args.get('date')
    today = datetime.today().strftime('%Y-%m-%d')
    time_filter = "AND s.show_time > CURTIME()" if selected_date == today else ""
   # --- AFTER ---
    query = f"SELECT id, theater_name, DATE_FORMAT(show_time, '%I:%i %p') AS show_time, price FROM showtimes s WHERE movie_id = %s AND show_date = %s {time_filter} ORDER BY theater_name, show_time"
    showtimes = execute_query(query, (movie_id, selected_date), fetch='all')
    return jsonify(showtimes or [])

@app.route('/api/showtime/<int:showtime_id>/booked_seats', methods=['GET'])
@login_required
def get_booked_seats(showtime_id):
    records = execute_query("SELECT seat_numbers FROM bookings WHERE showtime_id = %s", (showtime_id,), fetch='all')
    booked_seats = [seat for rec in records for seat in rec['seat_numbers'].split(',')] if records else []
    return jsonify(booked_seats)

@app.route('/api/book_ticket', methods=['POST'])
@user_required
def api_book_ticket():
    data = request.get_json()
    booking_id = execute_query(
        "INSERT INTO bookings (user_id, showtime_id, seat_numbers) VALUES (%s, %s, %s)",
        (session['user_id'], data['showtime_id'], ','.join(data['seats']))
    )
    if booking_id:
        return jsonify({'success': True, 'booking_id': booking_id})
    return jsonify({'success': False, 'message': 'Booking failed.'}), 500

from flask import send_file
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io

@app.route('/download_ticket/<int:ticket_id>')
@login_required
def download_ticket(ticket_id):
    query = """
    SELECT 
        b.id AS booking_id, b.seat_numbers, b.booking_time,
        s.show_date, 
        DATE_FORMAT(s.show_time, '%%I:%%i %%p') AS show_time, 
        s.price, 
        s.theater_name,
        m.title AS movie_title,
        u.username
    FROM bookings b
    JOIN showtimes s ON b.showtime_id = s.id
    JOIN movies m ON s.movie_id = m.id
    JOIN users u ON b.user_id = u.id
    WHERE b.id = %s AND b.user_id = %s
    """
    ticket = execute_query(query, (ticket_id, session['user_id']), fetch='one')

    if not ticket:
        return "Unauthorized or ticket not found", 403

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setTitle(f"Ticket_{ticket['booking_id']}")

    # Draw ticket content
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(200, 750, "Movie Ticket")

    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, 700, f"Ticket ID: {ticket['booking_id']}")
    pdf.drawString(50, 680, f"User: {ticket['username']}")
    pdf.drawString(50, 660, f"Movie: {ticket['movie_title']}")
    pdf.drawString(50, 640, f"Theater: {ticket['theater_name']}")
    pdf.drawString(50, 620, f"Date: {ticket['show_date']}")
    pdf.drawString(50, 600, f"Time: {ticket['show_time']}")
    pdf.drawString(50, 580, f"Seats: {ticket['seat_numbers']}")
    pdf.drawString(50, 560, f"Price: ₹{ticket['price']}")

    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f'ticket_{ticket["booking_id"]}.pdf',
        mimetype='application/pdf'
    )





# --- Run App ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)
