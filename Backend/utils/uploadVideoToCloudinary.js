
const cloudinary = require("../config/cloudinary");

const uploadVideoToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "liveproject/background-videos",
        resource_type: "video",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
};

module.exports = uploadVideoToCloudinary;
