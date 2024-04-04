const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/level", (req, res) => {
    const fileName = `./levels/${req.body.name}.json`;
    const level = JSON.stringify(req.body);
    if (fs.existsSync(fileName)) fs.writeFileSync(fileName, level);
    else fs.appendFileSync(fileName, level);
    res.end();
});


app.listen(8081, () => {
    console.log(`Editor server running on port localhost:8081`);
});
