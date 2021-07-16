const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const objectIdValidation = (id) => {
  const schema = Joi.object({
    id: Joi.objectId(),
  });
  return schema.validate(id);
};

module.exports = { objectIdValidation };
