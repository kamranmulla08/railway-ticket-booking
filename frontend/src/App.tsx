import { useState, type FormEvent } from 'react'
import AdminDashboard from './AdminDashboard'
import AdminManagementPage from './AdminManagementPage'
import BookingConfirmationPage from './BookingConfirmationPage'
import BrandLogo from './BrandLogo'
import LoginPage from './LoginPage'
import MyBookingsPage from './MyBookingsPage'
import PassengerBookingPage from './PassengerBookingPage'
import PnrStatusPage from './PnrStatusPage'
import Register from './Register'
import SeatSelectionPage from './SeatSelectionPage'
import SiteHeader from './SiteHeader'
import TrainDetailsPage from './TrainDetailsPage'
import TrainSearchResults from './TrainSearchResults'
import { authenticatedFetch, clearAuth, getToken } from './auth'
import './App.css'

function App() {
  const path = window.location.pathname
  const confirmationMatch = path.match(/^\/booking\/confirmation\/([^/]+)$/)
  const seatMatch = path.match(/^\/trains\/\d+\/seats$/)
  const trainMatch = path.match(/^\/trains\/\d+$/)
  const bookingMatch = path.match(/^\/booking\/\d+$/)
  const adminResourceMatch = path.match(/^\/admin\/(stations|trains|routes|coaches)$/)

  if (confirmationMatch) return <BookingConfirmationPage />
  if (seatMatch) return <SeatSelectionPage />
  if (trainMatch) return <TrainDetailsPage />
  if (bookingMatch) return <PassengerBookingPage />
  if (adminResourceMatch) return <AdminManagementPage />

  switch (path) {
    case '/register':
      return <Register />
    case '/login':
      return <LoginPage />
    case '/my-bookings':
      return <MyBookingsPage />
    case '/admin':
      return <AdminDashboard />
    case '/search':
      return <TrainSearchResults />
    case '/pnr':
      return <PnrStatusPage />
    default:
      return <HomePage />
  }
}

function HomePage() {
  const [fromStation, setFromStation] = useState('')
  const [toStation, setToStation] = useState('')
  const [journeyDate, setJourneyDate] = useState('')
  const [searchMessage, setSearchMessage] = useState('')

  function swapStations() {
    setFromStation(toStation)
    setToStation(fromStation)
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = getToken()

    if (!token) {
      setSearchMessage('Please log in to search live train availability.')
      return
    }

    setSearchMessage('Finding stations...')

    try {
      const response = await authenticatedFetch('/stations')

      if (response.status === 401) {
        clearAuth()
        window.location.assign('/login')
        return
      }
      if (!response.ok) throw new Error('Station search is unavailable.')

      const result = (await response.json()) as {
        stations: Array<{ id: number; name: string; code: string; city: string }>
      }
      const findStation = (value: string) => {
        const normalizedValue = value.trim().toLowerCase()
        return result.stations.find((station) =>
          [station.name, station.code, station.city].some(
            (field) => field.toLowerCase() === normalizedValue,
          ),
        )
      }
      const sourceStation = findStation(fromStation)
      const destinationStation = findStation(toStation)

      if (!sourceStation || !destinationStation) {
        setSearchMessage('Enter station names or codes that exist in the timetable.')
        return
      }
      if (sourceStation.id === destinationStation.id) {
        setSearchMessage('Choose different source and destination stations.')
        return
      }

      const params = new URLSearchParams({
        sourceStationId: String(sourceStation.id),
        destinationStationId: String(destinationStation.id),
        journeyDate,
      })
      window.location.assign(`/search?${params.toString()}`)
    } catch {
      setSearchMessage('Unable to search trains. Please try again.')
    }
  }

  return (
    <div className="site-shell">
      <SiteHeader currentPage="home" />

      <main>
        <section className="hero" id="home">
          <div className="hero-photo" role="img" aria-label="Passenger train traveling through the countryside" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="eyebrow"><span /> A better way to travel</p>
            <h1>Book Your<br />Train Journey</h1>
            <p className="hero-description">
              Find your route, choose your date, and let the journey begin.
            </p>
            <a className="hero-link" href="#search">Plan your trip <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-caption" aria-hidden="true">YOUR NEXT STOP IS CLOSER THAN YOU THINK</div>
        </section>

        <section className="search-section" aria-label="Search trains">
          <form className="search-panel" id="search" onSubmit={handleSearch}>
            <div className="search-heading">
              <div>
                <p className="section-kicker">START YOUR JOURNEY</p>
                <h2>Where would you like to go?</h2>
              </div>
              <span className="trip-label">ONE WAY</span>
            </div>

            <div className="search-fields">
              <label className="search-field">
                <span>From station</span>
                <input
                  type="text"
                  placeholder="e.g. New Delhi"
                  value={fromStation}
                  onChange={(event) => setFromStation(event.target.value)}
                  required
                />
              </label>

              <button
                className="swap-button"
                type="button"
                onClick={swapStations}
                aria-label="Swap departure and arrival stations"
                title="Swap stations"
              >
                <span aria-hidden="true">↔</span>
              </button>

              <label className="search-field">
                <span>To station</span>
                <input
                  type="text"
                  placeholder="e.g. Jaipur"
                  value={toStation}
                  onChange={(event) => setToStation(event.target.value)}
                  required
                />
              </label>

              <label className="search-field date-field">
                <span>Journey date</span>
                <input
                  type="date"
                  value={journeyDate}
                  onChange={(event) => setJourneyDate(event.target.value)}
                  required
                />
              </label>

              <button className="search-button" type="submit">
                Search Trains <span aria-hidden="true">→</span>
              </button>
            </div>
            <p className="search-message" role="status" aria-live="polite">
              {searchMessage ? `Journey selected: ${searchMessage}` : ''}
            </p>
          </form>
        </section>

        <section className="benefits-section" aria-label="Travel benefits">
          <div className="benefits-heading">
            <p className="section-kicker">THE JOURNEY, MADE SIMPLE</p>
            <h2>Travel with a little more ease.</h2>
          </div>
          <div className="benefits-list">
            <article className="benefit">
              <span className="benefit-number">01</span>
              <div>
                <h3>Easy Booking</h3>
                <p>Plan your trip in just a few steps.</p>
              </div>
            </article>
            <article className="benefit">
              <span className="benefit-number">02</span>
              <div>
                <h3>Secure Payments</h3>
                <p>Checkout designed with your peace of mind.</p>
              </div>
            </article>
            <article className="benefit">
              <span className="benefit-number">03</span>
              <div>
                <h3>Fast &amp; Reliable</h3>
                <p>Keep your travel plans moving smoothly.</p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home" aria-label="RailYatra home">
          <BrandLogo />
        </a>
        <span>Make room for the journey.</span>
      </footer>
    </div>
  )
}

export default App
