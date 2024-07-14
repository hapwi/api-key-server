const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
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

app.get("/players", async (req, res) => {
  try {
    const sheets = google.sheets({ version: "v4", auth: process.env.API_KEY });
    const playersSheetId = process.env.PLAYERS_SHEET_ID;
    const range = "Sheet1!A1:C200"; // Adjust the range as needed

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: playersSheetId,
      range: range,
    });

    const rows = response.data.values;
    if (rows.length) {
      const players = rows
        .slice(1)
        .filter((row) => row[0] && row[1] && row[2])
        .map(([name, score, imageUrl]) => ({
          name,
          score: score === "#VALUE!" || score === "0" ? "E" : score,
          imageUrl,
        }));

      res.json(players);
    } else {
      res.status(404).json({ error: "No data found." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = app;
