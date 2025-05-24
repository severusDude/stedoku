import React, { useState, useEffect } from "react";
import "./Home.css";

function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`home-container ${isLoaded ? 'loaded' : ''}`}>
      <div className="hero-section">
        <div className="hero-content">
          <div className="title-container">
            <h1 className="main-title">
              <span className="title-letter">S</span>
              <span className="title-letter">T</span>
              <span className="title-letter">E</span>
              <span className="title-letter">D</span>
              <span className="title-letter">O</span>
              <span className="title-letter">K</span>
              <span className="title-letter">U</span>
              <span className="title-space"></span>
              <span className="title-letter">S</span>
              <span className="title-letter">E</span>
              <span className="title-letter">C</span>
              <span className="title-letter">U</span>
              <span className="title-letter">R</span>
              <span className="title-letter">E</span>
            </h1>
            <div className="title-glow"></div>
          </div>
          
          <div className="subtitle-container">
            <p className="hero-subtitle">Amankan Pesanmu</p>
            <div className="subtitle-line"></div>
          </div>

          <div className="button-container">
            <a href="/encoding" className="play-button"> 
              <span className="button-text">Coba Sekarang!</span> 
              <div className="button-effects"> 
                <div className="effect-1"></div> 
                <div className="effect-2"></div> 
              </div> 
            </a>

            <button className="tutorial-button">
              <div className="button-border">
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
