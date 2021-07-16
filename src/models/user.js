const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      min: 6,
      max_length: 32,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      max_length: 32,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
    },
    image: { id: { type: String }, url: { type: String } },
    friends: [
      {
        user: {
          type: ObjectId,
          ref: "User",
        },
        //TODO : min-max validation not working
        status: {
          type: Number,
          min: 1,
          max: 4,
          //1 :'add friend',
          //2 :'requested',
          //3 :'pending',
          //4 :'friends'
        },
        time: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
