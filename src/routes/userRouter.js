const express = require("express");
const router = express.Router();
const {
  uploadImageController,
  addFriendController,
  acceptFriendController,
  friendListController,
  removeFriendController,
  rejectFriendController,
  removePendingReqController,
} = require("../controllers/userController");
const verifyToken = require("../middlewares/verifyToken");

router.post("/image", verifyToken, uploadImageController);
router.post("/addfriend", verifyToken, addFriendController);
router.post("/removefriend", verifyToken, removeFriendController);
router.post("/acceptfriendrequest", verifyToken, acceptFriendController);
router.post("/rejectfriendrequest", verifyToken, rejectFriendController);
router.post("/removefriendrequest", verifyToken, removePendingReqController); //route to remove pending friend request
router.get("/friends", verifyToken, friendListController);

module.exports = router;
