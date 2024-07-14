const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();
require("dotenv").config(); // Load environment variables from .env

app.use(
  cors({
    origin: "http://localhost:3000", // Allow your client application
    optionsSuccessStatus: 200,
  })
); // Enable CORS for all routes

app.get("/api-keys", async (req, res) => {
  const apiKey = process.env.API_KEY;
  const leaderboardSheetId = process.env.LEADERBOARD_SHEET_ID;
  const entriesSheetId = process.env.ENTRIES_SHEET_ID;
  const playersSheetId = process.env.PLAYERS_SHEET_ID;
  const formSheetId = process.env.FORM_SHEET_ID;

  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${playersSheetId}/values/Sheet1!A1:C200?key=${apiKey}`
    );
    const data = await response.json();

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

    res.json({
      apiKey,
      leaderboardSheetId,
      entriesSheetId,
      playersSheetId,
      formSheetId,
      players, // Include the fetched player data in the response
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
