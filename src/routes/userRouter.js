const express = require("express");
const router = express.Router();
const {
  uploadImageController,
  addFriendController,
  acceptFriendController,
} = require("../controllers/userController");
const verifyToken = require("../middlewares/verifyToken");

router.post("/image", verifyToken, uploadImageController);
router.post("/addfriend", verifyToken, addFriendController);
router.post("/acceptfriendrequest", verifyToken, acceptFriendController);

module.exports = router;
