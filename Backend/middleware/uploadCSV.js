
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    const isCSV =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");

    if (isCSV) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Please upload a valid CSV file."));
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
