import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // we can change the filename here if needed and ensure that there are no conflicts
    // we are using name just because this file will be only tempoararly stored for few seconds
    // and then will be deleted after uploading to cloudinary

    cb(null, file.originalname);
  },
});

export const upload = multer({ storage: storage });
