app.get("/api-keys", (req, res) => {
  console.log("API_KEY:", process.env.API_KEY);
  console.log("LEADERBOARD_SHEET_ID:", process.env.LEADERBOARD_SHEET_ID);

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
