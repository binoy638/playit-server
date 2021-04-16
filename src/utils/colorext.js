const axios = require("axios");

const colorext = async (url, name) => {
  try {
    const colors = await axios.post("https://colorext.herokuapp.com/color", {
      url,
      name,
    });
    if (colors && colors.data["StatusCode"] === 200) {
      return { colors: colors.data["data"] };
    } else {
      return undefined;
    }
  } catch (e) {
    console.log("Error while request for image color");
    return undefined;
  }
};

module.exports = {
  colorext,
};
