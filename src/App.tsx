import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { Button } from './components/ui/button'
import { Products } from './pages/Products'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Success } from './pages/Success'

function Navigation() {
  const { user, signOut } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Dopelist
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link to="/products" className="text-gray-700 hover:text-gray-900">
              Products
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Welcome to Dopelist
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your premium marketplace for enhanced listings and features
          </p>
          
          {user ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">
                Welcome back, {user.email}!
              </p>
              <Link to="/products">
                <Button size="lg">
                  View Products
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-x-4">
              <Link to="/signup">
                <Button size="lg">
                  Get Started
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" size="lg">
                  Browse Products
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/success" element={<Success />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App