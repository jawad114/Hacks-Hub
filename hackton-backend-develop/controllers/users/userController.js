const userModel = require('../../models/userModel');
const requestHandler = require('../../utils/requestHandler');
const cloudinary = require('../../middlewares/cloudinaryHandler');

async function handleGetUserList(req, res) {
  try {
    const users = await userModel.getUsers();
    return requestHandler.success(res, 200, 'Users fetched successfully', {
      users
    });
  } catch (error) {
    return requestHandler.error(res, 500, `server error ${error.message}`);
  }
}
async function handleGetSingleUser(req, res) {
  const { id } = req.params;
  const { email, username } = req.body;
  let searchQuery;
  if (id) {
    searchQuery = { id };
  }
  if (email) {
    searchQuery = { email };
  }
  if (username) {
    searchQuery = { username };
  }
  try {
    const user = await userModel.getSingleUser(searchQuery);
    if (user) {
      return requestHandler.success(res, 200, 'User fetched successfully', {
        user
      });
    }
    return requestHandler.error(
      res,
      400,
      `User with ${searchQuery} does not exist`
    );
  } catch (error) {
    return requestHandler.error(res, 500, `server error ${error.message}`);
  }
}

const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.decodedToken;
    const foundUser = await userModel.getSingleUser({ id: userId });

    if (foundUser) {
      let updates = {};

      // Allow participants to update additional fields
      if (foundUser.role === 'Participant') {
        if (req.body.codingExperience) {
          updates.codingExperience = req.body.codingExperience;
        }
        if (req.body.gitProfile) {
          updates.gitProfile = req.body.gitProfile;
        }
        if (req.body.linkedinProfile) {
          updates.linkedinProfile = req.body.linkedinProfile;
        }
        if (req.body.education) {
          updates.education = req.body.education;
        }
        if (req.body.organization) {
          updates.organization = req.body.organization;
        }
        if (req.body.instituteName) {
          updates.instituteName = req.body.instituteName;
        }
        if (req.body.languages) {
          updates.languages = req.body.languages;
        }
      }

      // Allow both organizers and participants to update common fields
      if (req.file) {
        const currentImage = JSON.parse(foundUser.image_url);
        req.body.image_url = [
          { avatar: req.file.secure_url, public_id: req.file.public_id }
        ];
        cloudinary.deleteCloudImage(currentImage);
        updates.image_url = req.body.image_url;
      }

      if (req.body.email && req.body.email !== foundUser.email) {
        updates.email = req.body.email;
      }

      if (req.body.username && req.body.username !== foundUser.username) {
        updates.username = req.body.username;
      }

      if (req.body.fullname && req.body.fullname !== foundUser.fullname) {
        updates.fullname = req.body.fullname;
      }

      if (req.body.bio && req.body.bio !== foundUser.bio) {
        updates.bio = req.body.bio;
      }

      const userUpdates = await userModel.updateUser(updates, userId);
      return requestHandler.success(res, 200, 'Profile updated successfully', {
        userUpdates
      });
    }

    return requestHandler.error(res, 400, `You are not authorized to do this`);
  } catch (error) {
    return requestHandler.error(res, 500, `Server error: ${error.message}`);
  }
};

module.exports = {
  handleGetUserList,
  handleGetSingleUser,
  updateUserProfile
};
