const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const app = express();

app.use(cors());

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.single("blueprint"), async (req, res) => {
  try {
    const form = new FormData();

    form.append("blueprint", fs.createReadStream(req.file.path));

    const ai = await axios.post("http://127.0.0.1:8000/convert", form, {
      headers: form.getHeaders(),
    });

    res.json({
      success: true,
      message: "Blueprint converted successfully!",
      walls: ai.data.walls,
      preview: ai.data.preview,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Conversion Failed",
    });
  }
});

app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
