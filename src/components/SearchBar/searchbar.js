import React, { useState } from "react";
import "./searchbar.css";

function searchBar({ search, searchUpdate, getSearch }) {
  return (
    <div className="content">
      <div className="input-search">
        <input
          className="input"
          placeholder="Search your hollywood celebrity here"
          value={search}
          type="text"
          onChange={searchUpdate}
          onSubmit={getSearch}
        />
      </div>
    </div>
  );
}

export default searchBar;
