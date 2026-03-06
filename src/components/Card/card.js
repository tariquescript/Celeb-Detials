import React from "react";
import "./card.css";

function Card({ name, birthday, nationality, occupation }) {
  return (
    <div className="card">
      <div className="card-content">
        <div className="card-header">
          <div className="celeb-name">
            <h4>{name || "Unknown Celebrity"}</h4>
          </div>
        </div>
        <div className="celeb-info">
          <ul>
            <li className="celeb-age">
              {/* DOB: {birthday || "N/A"} */}
            </li>
            <li className="celeb-nationality">
              Nationality: {nationality || "N/A"}
            </li>
            <li className="celeb-occupation">
              Occupation: {occupation || "N/A"}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}


export default Card;
