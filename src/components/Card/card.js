import React from "react";
import "./card.css";

function Card({ name, dob, nationality, occupation }) {

  const googleSearch = () => {
    const query = encodeURIComponent(name);
    window.open(`https://www.google.com/search?q=${query}`, "_blank");
  }

  return (
    <div className="card" onClick={googleSearch}>
      <div className="card-content">
        <h4>{name.toUpperCase() || "Unknown Celebrity"}</h4>

        <ul className="celeb-info">
          <li>
            <strong>DOB:</strong> {dob || "N/A"}
          </li>
          <li>
            <strong>Nationality:</strong> {nationality ? nationality.toUpperCase() : "N/A"}
          </li>
          <li>
            <strong>Occupation:</strong> {occupation || "N/A"}
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Card;
