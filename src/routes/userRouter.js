const express = require("express");
const { uploadImageController } = require("../controllers/userController");
const verifyToken = require("../middlewares/verifyToken");
const router = express.Router();

router.post("/image", verifyToken, uploadImageController);

module.exports = router;
