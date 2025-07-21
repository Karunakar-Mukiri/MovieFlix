document.addEventListener('DOMContentLoaded', () => {
    let calendarDate = new Date();
    let selectedDateElem = null;
    let selectedShowtimeElem = null;
    let currentShowtimeId = null;
    let currentTicketPrice = 0;
    let selectedSeats = [];

    const monthYearDisplay = document.getElementById('month-year-display');
    const calendarDates = document.getElementById('calendar-dates');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    const showtimesList = document.getElementById('showtimes-list');
    const seatingArea = document.getElementById('seating-area');
    const seatingPlaceholder = document.getElementById('seating-placeholder');
    const seatGrid = document.getElementById('seat-grid');
    const bookingSummary = document.getElementById('booking-summary');
    const selectedSeatsDisplay = document.getElementById('selected-seats-display');
    const totalPriceDisplay = document.getElementById('total-price');
    const proceedBtn = document.getElementById('proceed-to-pay-btn');
    
    const paymentModal = document.getElementById('payment-modal');
    const closePaymentModalBtn = document.getElementById('close-payment-modal');
    const paymentForm = document.getElementById('payment-form');
    const paymentAmountSpan = document.getElementById('payment-amount');

    function renderCalendar() {
        calendarDates.innerHTML = '';
        const month = calendarDate.getMonth();
        const year = calendarDate.getFullYear();
        monthYearDisplay.textContent = `${calendarDate.toLocaleString('default', { month: 'long' })} ${year}`;
        
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < firstDayOfMonth; i++) calendarDates.appendChild(document.createElement('div'));

        for (let i = 1; i <= daysInMonth; i++) {
            const dateElement = document.createElement('div');
            dateElement.textContent = i;
            const thisDate = new Date(year, month, i);

            if (thisDate < today) {
                dateElement.classList.add('other-month');
            } else {
                dateElement.addEventListener('click', () => handleDateClick(dateElement, thisDate));
            }
            if (thisDate.getTime() === today.getTime()) dateElement.classList.add('today');
            calendarDates.appendChild(dateElement);
        }
    }

    function handleDateClick(element, dateObject) {
        if (selectedDateElem) selectedDateElem.classList.remove('selected');
        element.classList.add('selected');
        selectedDateElem = element;
        resetShowtimeSelection();
        resetSeatSelection();
        const dateStringForAPI = dateObject.toISOString().split('T')[0];
        fetchAndDisplayShowtimes(dateStringForAPI);
    }

    prevMonthBtn.addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });
    nextMonthBtn.addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });

    async function fetchAndDisplayShowtimes(dateString) {
        showtimesList.innerHTML = '<p class="placeholder-text">Loading...</p>';
        const response = await fetch(`/api/movies/${movieId}/showtimes?date=${dateString}`);
        const showtimes = await response.json();

        showtimesList.innerHTML = '';
        if (showtimes.length > 0) {
            const theaters = {};
            showtimes.forEach(show => {
                if (!theaters[show.theater_name]) theaters[show.theater_name] = [];
                theaters[show.theater_name].push(show);
            });

            for (const theater in theaters) {
                const theaterDiv = document.createElement('div');
                theaterDiv.className = 'theater-group';
                theaterDiv.innerHTML = `<h4>${theater}</h4>`;
                const timesDiv = document.createElement('div');
                timesDiv.className = 'times-group';
                theaters[theater].forEach(show => {
                    const timeElem = document.createElement('div');
                    timeElem.className = 'time-slot';
                    timeElem.textContent = show.show_time;
                    timeElem.dataset.showtimeId = show.id;
                    timeElem.dataset.price = show.price;
                    timeElem.addEventListener('click', () => handleShowtimeClick(timeElem));
                    timesDiv.appendChild(timeElem);
                });
                theaterDiv.appendChild(timesDiv);
                showtimesList.appendChild(theaterDiv);
            }
        } else {
            showtimesList.innerHTML = '<p class="placeholder-text">No showtimes available.</p>';
        }
    }

    function handleShowtimeClick(element) {
        if (selectedShowtimeElem) selectedShowtimeElem.classList.remove('selected');
        element.classList.add('selected');
        selectedShowtimeElem = element;
        currentShowtimeId = element.dataset.showtimeId;
        currentTicketPrice = parseFloat(element.dataset.price);
        resetSeatSelection();
        fetchAndRenderSeats();
    }
    
    async function fetchAndRenderSeats() {
        seatingPlaceholder.textContent = 'Loading seats...';
        seatingArea.style.display = 'none';
        const response = await fetch(`/api/showtime/${currentShowtimeId}/booked_seats`);
        const bookedSeats = await response.json();
        
        seatGrid.innerHTML = '';
        const rows = 6, cols = 10;
        for (let i = 0; i < rows; i++) {
            for (let j = 1; j <= cols; j++) {
                const seat = document.createElement('div');
                const seatId = String.fromCharCode(65 + i) + j;
                seat.className = 'seat';
                seat.dataset.seatId = seatId;
                if (bookedSeats.includes(seatId)) {
                    seat.classList.add('occupied');
                } else {
                    seat.addEventListener('click', () => toggleSeatSelection(seat));
                }
                seatGrid.appendChild(seat);
            }
        }
        seatingPlaceholder.style.display = 'none';
        seatingArea.style.display = 'block';
        bookingSummary.style.display = 'block';
    }

    function toggleSeatSelection(seat) {
        const seatId = seat.dataset.seatId;
        const seatIndex = selectedSeats.indexOf(seatId);
        if (seatIndex > -1) {
            selectedSeats.splice(seatIndex, 1);
            seat.classList.remove('selected');
        } else {
            selectedSeats.push(seatId);
            seat.classList.add('selected');
        }
        updateBookingSummary();
    }

    function updateBookingSummary() {
        if (selectedSeats.length > 0) {
            selectedSeatsDisplay.textContent = selectedSeats.join(', ');
            totalPriceDisplay.textContent = (selectedSeats.length * currentTicketPrice).toFixed(2);
            proceedBtn.disabled = false;
        } else {
            selectedSeatsDisplay.textContent = 'None';
            totalPriceDisplay.textContent = '0.00';
            proceedBtn.disabled = true;
        }
    }

    function resetShowtimeSelection() {
        if (selectedShowtimeElem) selectedShowtimeElem.classList.remove('selected');
        selectedShowtimeElem = null;
        currentShowtimeId = null;
        currentTicketPrice = 0;
        seatingPlaceholder.textContent = 'Please select a showtime.';
        seatingPlaceholder.style.display = 'block';
        seatingArea.style.display = 'none';
        bookingSummary.style.display = 'none';
    }

    function resetSeatSelection() {
        selectedSeats = [];
        updateBookingSummary();
    }
    
    proceedBtn.addEventListener('click', () => {
        paymentAmountSpan.textContent = totalPriceDisplay.textContent;
        paymentModal.style.display = 'block';
    });
    
    closePaymentModalBtn.addEventListener('click', () => paymentModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === paymentModal) paymentModal.style.display = 'none';
    });

    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cardNumber = document.getElementById('card-number').value.trim();
        const expiry = document.getElementById('expiry-date').value.trim();
        const cvv = document.getElementById('cvv').value.trim();

        // Perform client-side validation
        if (!/^\d{16}$/.test(cardNumber)) {
            alert("Card number must be exactly 16 digits.");
            return;
        }

        const match = expiry.match(/^(\d{2})\/(\d{2})$/);
        if (!match) {
            alert("Expiry must be in MM/YY format.");
            return;
        }

        const expMonth = parseInt(match[1], 10);
        const expYear = 2000 + parseInt(match[2], 10);
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        if (expMonth < 1 || expMonth > 12) {
            alert("Invalid expiry month.");
            return;
        }

        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
            alert("Card is expired.");
            return;
        }
        
        if (!/^\d{3}$/.test(cvv)) {
            alert("CVV must be exactly 3 digits.");
            return;
        }

        if (selectedSeats.length === 0) {
            alert("Please select at least one seat.");
            return;
        }

        // Proceed with the booking API call
        try {
            const response = await fetch('/api/book_ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ showtime_id: currentShowtimeId, seats: selectedSeats })
            });
            const result = await response.json();
            if (result.success) {
                window.location.href = `/ticket/${result.booking_id}`;
            } else {
                alert(`Booking failed: ${result.message}`);
                paymentModal.style.display = 'none';
            }
        } catch (error) {
            alert("An error occurred while booking.");
            console.error(error);
        }
    });

    renderCalendar();
});