import React, { useState, useEffect } from "react";
import "./Main.css";
import Header from "./components/Header/Header";
import SearchBar from "./components/SearchBar/searchbar";
import Card from "./components/Card/card";

function Main() {
  const [celebs, setCelebs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("https://celebrity-bucks.p.rapidapi.com/birthdays/JSON", {
      method: "GET",
      headers: {
        "x-rapidapi-host": "celebrity-bucks.p.rapidapi.com",
        "x-rapidapi-key": "YOUR_API_KEY_HERE",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("API Error: " + res.status);
        }
        return res.json();
      })
      .then((data) => {
        setCelebs(data.Birthdays || []);
        console.log("fetching data");
      })
      .catch((err) => {
        console.error("API failed:", err);
      });
  }, []);

  // Search input handler
  const searchUpdate = (e) => {
    setSearch(e.target.value);
  };

  // Filter celebs
  const filteredCelebs = celebs.filter((celeb) =>
    celeb.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header />
      <SearchBar
        search={search}
        searchUpdate={searchUpdate}
      />
      <div className="my-card">
        {filteredCelebs.map((celeb) => (
          <Card
            key={celeb.id}
            name={celeb.name}
            dob={celeb.dob}
            twitter={celeb.twitter}
            age={celeb.age}
          />
        ))}
      </div>
    </div>
  );
}

export default Main;
