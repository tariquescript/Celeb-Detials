import React, { useState, useEffect } from "react";
import "./Main.css";
import Header from "./components/Header/Header";
import SearchBar from "./components/SearchBar/searchbar";
import Card from "./components/Card/card";

function Main() {
  const [celebs, setCelebs] = useState([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    var unirest = require("unirest");

    var req = unirest(
      "GET",
      "https://celebrity-bucks.p.rapidapi.com/birthdays/JSON"
    );

    req.headers({
      "x-rapidapi-host": "celebrity-bucks.p.rapidapi.com",
      "x-rapidapi-key": "983c8a5fe3mshd8124d605681539p159aeejsn2d0ae1ec21b4",
      useQueryString: true,
    });

    req.end(function (res) {
      if (res.error) throw new Error(res.error);
      const myData = res.body.Birthdays;
      setCelebs(myData);
      console.log("fetching data");
    });
  }, [query]);

  ///////////////////////////////// SearchUpdate/////////////////////////////////

  const searchUpdate = (e) => {
    setSearch(e.target.value);
  };
  console.log(search);

  /////////////////////////////////// getSearch /////////////////////////////////////////

  const getSearch = () => {
    setQuery(setSearch);
  };

  return (
    <div>
      <Header />
      <SearchBar
        search={search}
        searchUpdate={searchUpdate}
        getSearch={getSearch}
      />
      <div className="my-card">
        {celebs.map((celeb) => (
          <Card
            name={celeb.name}
            dob={celeb.dob}
            twitter={celeb.twitter}
            age={celeb.age}
            key={celeb.id}
          />
        ))}
      </div>
    </div>
  );
}

export default Main;
