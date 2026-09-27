const fs = require("fs");
const path = require("path");

const User = require("../models/User");

/*
|--------------------------------------------------------------------------
| UPLOAD PROFILE PHOTO
|--------------------------------------------------------------------------
|
| Route:
| POST /api/user/uploadFiles
|
| Middleware:
| auth
| uploadProfile.single("file")
|
| The uploaded image is saved to:
|
| uploads/profile/
|
| The image URL is stored in:
|
| User.profilePhoto
|
|--------------------------------------------------------------------------
*/

exports.uploadProfilePhoto =
  async (req, res) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | GET LOGGED-IN USER ID
      |--------------------------------------------------------------------------
      |
      | Your auth middleware puts the
      | authenticated user inside req.user.
      |
      */

      const userId =
        req.user?.id ||
        req.user?._id ||
        req.user?.userId;

      if (!userId) {
        /*
        * If authentication information
        * is missing, remove the uploaded
        * file if multer already saved it.
        */

        if (req.file?.path) {
          try {
            if (
              fs.existsSync(
                req.file.path
              )
            ) {
              fs.unlinkSync(
                req.file.path
              );
            }
          } catch (deleteError) {
            console.log(
              "Uploaded file cleanup warning:",
              deleteError.message
            );
          }
        }

        return res.status(401).json({
          success: false,
          message:
            "Authentication required. Please login again.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | CHECK FILE
      |--------------------------------------------------------------------------
      */

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a profile image.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | FIND USER
      |--------------------------------------------------------------------------
      */

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        /*
        * User does not exist.
        * Delete the uploaded image.
        */

        try {
          if (
            req.file.path &&
            fs.existsSync(
              req.file.path
            )
          ) {
            fs.unlinkSync(
              req.file.path
            );
          }
        } catch (deleteError) {
          console.log(
            "Uploaded file cleanup warning:",
            deleteError.message
          );
        }

        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | DELETE OLD PROFILE PHOTO
      |--------------------------------------------------------------------------
      |
      | Only delete files that belong
      | to our local uploads/profile folder.
      |
      */

      if (
        user.profilePhoto &&
        user.profilePhoto.includes(
          "/uploads/profile/"
        )
      ) {
        try {
          const oldFileName =
            path.basename(
              user.profilePhoto
            );

          const oldFilePath =
            path.join(
              __dirname,
              "..",
              "uploads",
              "profile",
              oldFileName
            );

          if (
            fs.existsSync(
              oldFilePath
            )
          ) {
            fs.unlinkSync(
              oldFilePath
            );

            console.log(
              "🗑️ Old profile photo deleted:",
              oldFileName
            );
          }
        } catch (deleteError) {
          /*
          * Do not fail the new upload
          * just because old-image deletion
          * failed.
          */

          console.log(
            "Old profile image delete warning:",
            deleteError.message
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | SERVER BASE URL
      |--------------------------------------------------------------------------
      |
      | In Render, set:
      |
      | SERVER_URL=https://jaytech-backend-4.onrender.com
      |
      | Local development can fall back
      | to the current request host.
      |
      */

      const baseUrl =
        process.env.SERVER_URL?.trim() ||
        `${req.protocol}://${req.get(
          "host"
        )}`;

      /*
      |--------------------------------------------------------------------------
      | NORMALIZE BASE URL
      |--------------------------------------------------------------------------
      |
      | Prevent:
      |
      | https://example.com//uploads
      |
      */

      const cleanBaseUrl =
        baseUrl.replace(
          /\/+$/,
          ""
        );

      /*
      |--------------------------------------------------------------------------
      | CREATE PROFILE PHOTO URL
      |--------------------------------------------------------------------------
      */

      const profilePhoto =
        `${cleanBaseUrl}/uploads/profile/${req.file.filename}`;

      /*
      |--------------------------------------------------------------------------
      | SAVE PHOTO URL TO MONGODB
      |--------------------------------------------------------------------------
      */

      user.profilePhoto =
        profilePhoto;

      await user.save();

      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      |
      | Return both:
      |
      | profilePhoto
      |
      | and complete user information.
      |
      | This allows React Native to immediately
      | update AsyncStorage.
      |
      */

      return res.status(200).json({
        success: true,

        message:
          "Profile photo uploaded successfully.",

        profilePhoto:
          user.profilePhoto,

        user: {
          id: user._id,
          _id: user._id,

          fname:
            user.fname,

          lname:
            user.lname,

          email:
            user.email,

          mobilenumber:
            user.mobilenumber,

          countryCode:
            user.countryCode,

          role:
            user.role,

          rating:
            user.rating,

          gems:
            user.gems,

          randomAvatar:
            user.randomAvatar,

          profilePhoto:
            user.profilePhoto,
        },
      });
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | ERROR HANDLING
      |--------------------------------------------------------------------------
      */

      console.error(
        "❌ Profile photo upload error:",
        error
      );

      /*
      |--------------------------------------------------------------------------
      | CLEANUP NEW FILE
      |--------------------------------------------------------------------------
      |
      | If something failed after multer
      | saved the file, remove that file.
      |
      */

      if (req.file?.path) {
        try {
          if (
            fs.existsSync(
              req.file.path
            )
          ) {
            fs.unlinkSync(
              req.file.path
            );

            console.log(
              "🗑️ Failed upload file removed."
            );
          }
        } catch (cleanupError) {
          console.log(
            "Upload cleanup warning:",
            cleanupError.message
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | SERVER RESPONSE
      |--------------------------------------------------------------------------
      */

      return res.status(500).json({
        success: false,
        message:
          "Profile photo upload failed.",
      });
    }
  };
