
import { useState } from 'react'
import { useNavigate } from 'react-router'
import api from './api'
import './App.css'
import FlightSection from './components/FlightSection'
import Hero from './components/Hero'

function App() {
  const navigate = useNavigate()
  const [flights, setFlights] = useState([])
  const [search, setSearch] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [searchVersion, setSearchVersion] = useState(0)

  const handleSearch = async (criteria) => {
    setSearchVersion((version) => version + 1)
    setSearch(criteria)
    setFlights([])
    setSearchError('')
    setIsSearching(true)
    setHasSearched(true)

    try {
      const { data } = await api.post('/api/flights/search', criteria)

      if (!Array.isArray(data.flights)) {
        throw new Error('The backend returned an invalid flight search response.')
      }

      setFlights(data.flights)
    } catch (error) {
      setSearchError(
        error.response?.data?.error ||
        (error.code === 'ECONNABORTED'
          ? 'The flight search took too long. Please try again.'
          : error.response
            ? `Flight search failed with status ${error.response.status}.`
            : 'Could not connect to the backend. Start it with "npm start" from the backend folder.')
      )
    } finally {
      setIsSearching(false)
      requestAnimationFrame(() => {
        document.getElementById('flight-results')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }
  }

  return (
    <>
      <Hero onSearch={handleSearch} isSearching={isSearching} />
      <FlightSection
        key={searchVersion}
        flights={flights}
        search={search}
        isLoading={isSearching}
        error={searchError}
        hasSearched={hasSearched}
        onSelect={(flight) => navigate('/booking', { state: { flight, search } })}
      />
    </>
  )
}

export default App
