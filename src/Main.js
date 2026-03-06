import React, { useState, useEffect } from "react";
import "./Main.css";
import Header from "./components/Header/Header";
import SearchBar from "./components/SearchBar/searchbar";
import Card from "./components/Card/card";

function Main() {
  const [celebs, setCelebs] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!search || search.length < 3) return;

    const delay = setTimeout(() => {
      fetch(
        `https://celebrity-by-api-ninjas.p.rapidapi.com/v1/celebrity?name=${search}`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": process.env.REACT_APP_RAPIDAPI_KEY,
            "X-RapidAPI-Host": "celebrity-by-api-ninjas.p.rapidapi.com",
          },
        }
      )
        .then((res) => {
          if (!res.ok) {
            throw new Error("API Error: " + res.status);
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setCelebs(data);
          } else {
            setCelebs([]);
          }
        })
        .catch((err) => console.error("API failed:", err));
    }, 800); // debounce

    return () => clearTimeout(delay);
  }, [search]);

  const searchUpdate = (e) => {
    setSearch(e.target.value);
  };

  const filteredCelebs = Array.isArray(celebs)
    ? celebs.filter((celeb) =>
        celeb.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

    console.log(celebs);

  return (
    <div>
      <Header />
      <SearchBar search={search} searchUpdate={searchUpdate} />

      <div className="my-card">
        {filteredCelebs.map((celeb, index) => (
          <Card
            key={index}
            name={celeb.name}
            nationality={celeb.nationality}
            // birthday={celeb.birthday}
            occupation={celeb.occupation}
          />
        ))}
      </div>
    </div>
  );
}

export default Main;