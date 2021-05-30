const Joi = require("joi");

const playlistValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(32).required(),
    tracks: Joi.array().items(Joi.object()),
    email: Joi.string().min(6).required().email(),
    // image: Joi.string().base64(),
  });
  return schema.validate(data);
};

module.exports = { playlistValidation };
