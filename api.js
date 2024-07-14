const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
require("dotenv").config();

app.use(cors());

// Helper function to fetch data from Google Sheets
async function fetchSheetData(sheetId, range, apiKey) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
  const response = await axios.get(url);
  return response.data.values;
}

app.get("/api/players", async (req, res) => {
  try {
    const apiKey = process.env.API_KEY;
    const playersSheetId = process.env.PLAYERS_SHEET_ID;

    const data = await fetchSheetData(playersSheetId, "Sheet1!A1:C200", apiKey);

    const players = data
      .slice(1)
      .filter((row) => row[0] && row[1] && row[2])
      .map(([name, score, imageUrl]) => ({
        name,
        score: score === "#VALUE!" || score === "0" ? "E" : score,
        imageUrl,
      }));

    res.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ error: "Failed to fetch player data" });
  }
});

module.exports = app;
