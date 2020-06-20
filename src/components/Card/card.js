import React from "react";
import "./card.css";

function Card({ name, dob, twitter, age }) {
  return (
    <div className="card">
      <div className="card-content">
        <div className="card-header">
          <div className="celeb-name">
            <h4> {name}</h4>
          </div>
        </div>
        <div className="celeb-info">
          <ul>
            <li className="celeb-age"> DOB :{dob} </li>
            <li className="celeb-age"> Age :{age} </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Card;
