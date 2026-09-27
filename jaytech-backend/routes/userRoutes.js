const express = require("express");

const router =
  express.Router();

const auth =
  require("../middleware/auth");

const uploadProfile =
  require("../middleware/uploadProfile");

const userController =
  require("../controllers/userController");

/*
|--------------------------------------------------------------------------
| PROFILE PHOTO
|--------------------------------------------------------------------------
|
| POST
| /api/user/uploadFiles
|
| multipart/form-data
| field: file
|
*/

router.post(
  "/uploadFiles",
  auth,
  uploadProfile.single("file"),
  userController.uploadProfilePhoto
);

module.exports = router;