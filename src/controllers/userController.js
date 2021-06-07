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
    const deleteResponse = await cloudinary.uploader.destroy(oldUser.image.id);
    if (!deleteResponse) {
      console.log("Could not delete image ", oldUser.image.id);
    }
    res.status(200).send({ image });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};
