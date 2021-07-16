const User = require("../models/user");
const { cloudinary } = require("../configs/cloudinary");
const { objectIdValidation } = require("../validators/basicValidator");
const mongoose = require("mongoose");

//Controller to update upload profile image

exports.uploadImageController = async (req, res) => {
  const { user } = req;
  let image;
  try {
    const fileStr = req.body?.base64;

    if (!fileStr) return res.sendStatus(400);

    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      upload_preset: "playitUserImages",
    });
    if (uploadResponse) {
      image = { id: uploadResponse.public_id, url: uploadResponse.url };
    } else {
      return res.sendStatus(500);
    }
    const oldUser = await User.findOneAndUpdate({ _id: user._id }, { image });
    if (oldUser.image.id) {
      const deleteResponse = await cloudinary.uploader.destroy(
        oldUser.image.id
      );
      if (!deleteResponse) {
        console.log("Could not delete image ", oldUser.image.id);
      }
    }

    res.status(200).send({ image });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

/**
Status codes
1 :'add friend',
2 :'requested',
3 :'pending',
4 :'friends' 
**/

//Controller to fetch friend list of an user

exports.friendListController = async (req, res) => {
  const { user } = req;
  try {
    const userDoc = await User.findOne({ _id: user._id }, "friends").populate(
      "friends.user",
      "username email image"
    );
    if (!userDoc) return res.status(404).send({ message: "No user found" });
    res.send({ friends: userDoc.friends });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Database error" });
  }
};

//Controller to add friends

exports.addFriendController = async (req, res) => {
  const { user } = req;

  const { userID: friendUserID } = req.body;

  if (!friendUserID)
    return res.status(400).send({ message: "No userID found." });

  const { error } = objectIdValidation({ id: friendUserID });

  if (error) return res.status(400).send({ message: "Invalid userID." });

  try {
    const friendExists = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(user._id),
        },
      },
      { $unwind: "$friends" },
      {
        $match: {
          "friends.user": new mongoose.Types.ObjectId(friendUserID),
        },
      },
      {
        $project: { friends: true },
      },
    ]);

    if (friendExists.length)
      return res.status(400).send({
        message: "User already exist in friend list.",
        isfriend: true,
        status: friendExists[0].friends.status,
      });

    //added this user
    const updatedfriendUser = await User.findOneAndUpdate(
      { _id: friendUserID },
      { $push: { friends: { user: { _id: user._id }, status: 2 } } },
      { new: true }
    );
    if (!updatedfriendUser)
      return res
        .status(404)
        .send({ message: "Could not find the user(friend)." });
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $push: { friends: { user: updatedfriendUser._id, status: 3 } } },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).send({ message: "Could not find the user." });

    res.send({ message: "friend added", friends: updatedUser.friends });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Database error" });
  }
};

//Controller to remove friends

exports.removeFriendController = async (req, res) => {
  const { user } = req;

  const { userID: friendUserID } = req.body;

  if (!friendUserID)
    return res.status(400).send({ message: "No userID found." });

  const { error } = objectIdValidation({ id: friendUserID });

  if (error) return res.status(400).send({ message: "Invalid userID." });

  try {
    const updateUser = await User.updateOne(
      { _id: user._id, "friends.user": friendUserID, "friends.status": 4 },
      { $pull: { friends: { user: { _id: friendUserID }, status: 4 } } }
    );
    if (updateUser.nModified === 0)
      return res
        .status(400)
        .send({ message: "could not remove friend(user1)" });

    const updatefriendUser = await User.updateOne(
      { _id: friendUserID, "friends.user": user._id, "friends.status": 4 },
      { $pull: { friends: { user: { _id: user._id }, status: 4 } } }
    );

    if (updatefriendUser.nModified === 0)
      return res
        .status(400)
        .send({ message: "could not remove friend(user2)" });

    res.send({ message: "friend removed" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Database error" });
  }
};

//Controller to accept friend requests

exports.acceptFriendController = async (req, res) => {
  const { user } = req;

  const { userID: requestID } = req.body;

  if (!requestID) return res.status(400).send({ message: "No userID found." });

  const { error } = objectIdValidation({ id: requestID });

  if (error) return res.status(400).send({ message: "Invalid userID." });

  try {
    const updatedUser = await User.updateOne(
      { _id: user._id, "friends.user": requestID, "friends.status": 2 },
      { $set: { "friends.$.status": 4 } }
    );

    if (updatedUser?.nModified === 0)
      return res
        .status(400)
        .send({ message: "No friend request found to accept." });

    const updateFriend = await User.findOneAndUpdate(
      { _id: requestID, "friends.user": user._id, "friends.status": 3 },
      { $set: { "friends.$.status": 4 } }
    );

    if (updateFriend?.nModified === 0)
      return res.status(400).send({ message: "No pending request found." });

    res.send({ message: "Friend request accepted" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Database error" });
  }
};

//Controller to reject friend requests

exports.rejectFriendController = async (req, res) => {
  const { user } = req;

  const { userID: requestID } = req.body;

  if (!requestID) return res.status(400).send({ message: "No userID found." });

  const { error } = objectIdValidation({ id: requestID });

  if (error) return res.status(400).send({ message: "Invalid userID." });

  try {
    const updateUser = await User.updateOne(
      { _id: user._id, "friends.user": requestID, "friends.status": 2 },
      { $pull: { friends: { user: { _id: requestID }, status: 2 } } }
    );
    if (updateUser.nModified === 0)
      return res
        .status(400)
        .send({ message: "could not update friend list(user1)" });

    const updatefriendUser = await User.updateOne(
      { _id: requestID, "friends.user": user._id, "friends.status": 3 },
      { $pull: { friends: { user: { _id: user._id }, status: 3 } } }
    );

    if (updatefriendUser.nModified === 0)
      return res
        .status(400)
        .send({ message: "could not update friend list(user2)" });

    res.send({ message: "friend request rejected" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Database error" });
  }
};
