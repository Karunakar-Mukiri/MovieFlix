# 🎬 MovieFlix - A Movie Ticket Booking Web App

A full-featured web application built with **Python Flask** that allows users to browse movies, select showtimes, pick seats, make bookings, and download tickets in PDF format. This project demonstrates a complete cinema booking workflow with a user-friendly interface and robust backend logic.

---

## 🚀 Features

* 🔍 Browse movies with posters, details, and showtimes
* 📅 Custom calendar for selecting available dates
* 🕒 Dynamic showtime and seat selection interface
* 💳 Secure payment form with real-time validation
* 🎫 Auto-generated downloadable ticket in PDF format
* ✅ Client-side and server-side form validation
* 🔐 User authentication and session management (optional)

---

## 🛠️ Tech Stack

**Frontend:**

* HTML5, CSS3, JavaScript
* Jinja2 (Templating)
* Responsive UI (custom-styled)

**Backend:**

* Python 3
* Flask Web Framework
* SQLAlchemy (ORM)
* SQLite (or PostgreSQL for production)

**Other Tools:**

* PDF generation using `reportlab` or `WeasyPrint`
* Git & GitHub for version control

---


## 📁 Folder Structure

```
├── app.py                  # Main Flask application
├── templates/
│   └── user/
│       └── booking.html    # Booking page with seat & payment UI
├── static/
│   └── js/
│       └── booking.js      # Handles frontend logic (calendar, seats, validation)
├── models.py               # SQLAlchemy models (User, Movie, Booking, etc.)
├── requirements.txt        # Python dependencies
├── README.md               # Project documentation
```

---

## 🔒 Payment Form Validation

The payment modal includes JavaScript validation for:

* Card number: Must be exactly 16 digits
* CVV: 3-digit numeric
* Expiry Date: Must be a future date (in MM/YY format)
* All fields must be filled before submission

If any validation fails, booking is halted and an alert is displayed. No ticket is booked unless inputs are valid.

---

## 📄 Ticket Download

After successful booking, users can:

* View confirmation
* Click the **Download** button to get a PDF ticket containing:

  * Movie title
  * Show date/time
  * Seat numbers
  * Booking reference

---

## 📦 Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/movie-booking-app.git
   cd movie-booking-app
   ```

2. **Create a virtual environment & activate it:**

   ```bash
   python -m venv venv
   source venv/bin/activate  # on Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application:**

   ```bash
   python app.py
   ```

5. Visit `http://127.0.0.1:5000` in your browser.

---

## ✅ To-Do / Future Enhancements

* Integrate real payment gateway (e.g., Stripe/Razorpay)
* Add user login/signup & booking history
* Add admin dashboard for managing shows/seats
* Responsive design improvements

---

## 🙌 Acknowledgements

* [Flask](https://flask.palletsprojects.com/)
* [ReportLab / WeasyPrint](https://www.reportlab.com/)
* Open source movie poster images (for demo only)



## 👨‍💻 Author

**Karunakar Mukiri**
[GitHub](https://github.com/Karunakar-Mukiri)

