const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  registerValidation,
  loginValidation,
} = require("../validators/authValidator");

exports.registrationController = async (req, res) => {
  const { error } = registerValidation(req.body);

  if (error) return res.status(400).send(error.details[0].message);
  const { username, email, password } = req.body;

  try {
    const emailExist = await User.findOne({ email });
    if (emailExist) return res.status(400).send("Email already exisits");

    const usernameExist = await User.findOne({ username });
    if (usernameExist) return res.status(400).send("Username already exisits");

    const salt = await bcrypt.genSalt(10);
    const hashedpassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      email,
      password: hashedpassword,
      image: {
        id: null,
        url: "https://static-cdn.jtvnw.net/user-default-pictures-uv/cdd517fe-def4-11e9-948e-784f43822e80-profile_image-300x300.png",
      },
    });

    await user.save();
    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.loginController = async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate(
      "friends.user",
      "username email image"
    );

    if (!user)
      return res.status(401).send("Invalid credentials. Please try again.");
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(401).send("Invalid Credentials");
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_TOKEN);

    res.status(200).send({
      token,
      username: user.username,
      email: user.email,
      image: user.image,
      friends: user.friends,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};
