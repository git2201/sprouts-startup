import React from 'react'

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <img src="/sprout-logo.png" alt="Sprout Logo" style={{ height: '3.5rem', width: 'auto' }} />
          <h1>Sprout</h1>
        </div>
        <p className="tagline">Find your perfect cofounder</p>
      </div>
    </header>
  )
}

export default Header 