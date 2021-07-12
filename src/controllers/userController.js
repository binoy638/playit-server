const User = require("../models/user");
const { cloudinary } = require("../configs/cloudinary");

exports.uploadImageController = async (req, res) => {
  const { user } = req;
  let image;
  try {
    const fileStr = req.body.data;
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

//1 :'add friend',
//2 :'requested',
//3 :'pending',
//4 :'friends'

exports.addFriendController = async (req, res) => {
  const { user: sender } = req;

  const { userID: friendUserID } = req.body.data;

  if (!friendUserID) return res.sendStatus(400);

  try {
    //added this user
    const updatedfriendUser = await User.findOneAndUpdate(
      { _id: friendUserID },
      { $push: { friends: { user: { _id: sender }, status: 2 } } },
      { new: true }
    );
    if (!updatedfriendUser) return res.sendStatus(404);
    const updatedSender = await User.findOneAndUpdate(
      { _id: sender },
      { $push: { friends: { user: updatedfriendUser._id, status: 3 } } },
      { new: true }
    );

    if (!updatedSender) return res.sendStatus(404);

    res.send({ success: true, friends: updatedSender.friends });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};

exports.acceptFriendController = async (req, res) => {
  const { user } = req;

  const { requestID } = req.body.data;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id, "friends.user": requestID },
      { $set: { "friends.$.status": 4 } },
      { new: true }
    );
    const updateFriend = await User.findOneAndUpdate(
      { _id: requestID, "friends.user": user._id },
      { $set: { "friends.$.status": 4 } }
    );
    res.send({ friends: updatedUser.friends });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};
