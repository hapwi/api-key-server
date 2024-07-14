const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // Make sure to install this package
const app = express();
require("dotenv").config(); // Load environment variables from .env

app.use(cors()); // Enable CORS for all routes

app.get("/api-keys", (req, res) => {
  const apiKey = process.env.API_KEY;
  const leaderboardSheetId = process.env.LEADERBOARD_SHEET_ID;
  const entriesSheetId = process.env.ENTRIES_SHEET_ID;
  const playersSheetId = process.env.PLAYERS_SHEET_ID;
  const formSheetId = process.env.FORM_SHEET_ID;

  res.json({
    apiKey,
    leaderboardSheetId,
    entriesSheetId,
    playersSheetId,
    formSheetId,
  });
});

const fetchPlayers = async () => {
  try {
    const apiKey = process.env.API_KEY;
    const playersSheetId = process.env.PLAYERS_SHEET_ID;

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${playersSheetId}/values/Sheet1!A1:C200?key=${apiKey}`
    );
    const data = await response.json();

    // Log the raw data for debugging
    console.log("Raw data from Google Sheets API:", data);

    if (data.error) {
      throw new Error(data.error.message);
    }

    const players = data.values
      .slice(1)
      .filter((row) => row[0] && row[1] && row[2])
      .map(([name, score, imageUrl]) => ({
        name,
        score: score === "#VALUE!" || score === "0" ? "E" : score,
        imageUrl,
      }));

    // Log the processed player data
    console.log("Processed player data:", players);

    return players;
  } catch (error) {
    console.error("Error fetching players:", error);
    throw error;
  }
};

app.get("/players", async (req, res) => {
  try {
    const players = await fetchPlayers();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

module.exports = app;
