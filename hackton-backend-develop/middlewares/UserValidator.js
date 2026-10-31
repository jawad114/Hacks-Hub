const bcrypt = require('bcrypt');
const decode = require('jwt-decode');
const checkItem = require('../utils/checkInputs');
const requestHandler = require('../utils/requestHandler');
const userModel = require('../models/userModel');
require('dotenv').config();
const teamModel = require('../models/participantTeamsModels');
const organizerModel = require('../models/eventTeamModel');
const server = require('../api/server');

/**
 * Validates all routes
 * @class UserValidator
 */
module.exports = class UserValidator {
  /**
   * Validates all user details
   * @param {obj} req
   * @param {obj} res
   * @param {obj} next
   * @returns {obj} Validation error messages or contents of req.body
   */
  static async userInput(req, res, next) {
    const { email, password, fullname, username, mobile, country, region, DOB, role } = req.body;
    const { id } = req.params;

    const check = checkItem({
      email,
      password,
      fullname,
      username,
      mobile,
      country,
      region,
      DOB,
      role
    });

    if (Object.keys(check).length > 0) {
      return res.status(400).json({
        statusCode: 400,
        check
      });
    }

    const userEmail = await userModel.getUserBy({ email });
    if (userEmail !== undefined) {
      return requestHandler.error(
        res,
        409,
        `User with email ${email} already exists`
      );
    }

    const hash = await bcrypt.hash(password, 15);
    const newUser = await userModel.addUser({
      email,
      password: hash,
      fullname,
      username,
      mobile,
      country,
      region,
      DOB,
      role
    });

    if (id) {
      if (role) {
        if (role === 'Participant') {
          // Add participant-specific fields only if the role is "Participant"
          await participantModel.addParticipantDetails({
            user_id: newUser.id,
            coding_experience: req.body.coding_experience,
            git_profile: req.body.git_profile,
            linkedin_profile: req.body.linkedin_profile,
            education: req.body.education,
            organization: req.body.organization,
            institute_name: req.body.institute_name,
            languages: req.body.languages
          });
        } else {
          // If the role is not "Participant", add to team or event as appropriate
          await organizerModel.addTeamMember({
            user_id: newUser.id,
            event_id: id,
            role_type: role
          });
        }
      }
      
      await teamModel.addTeamMate({
        team_id: id,
        team_member: newUser.id
      });
    }

    // Attach the new user object to the request and proceed to the next middleware
    req.newuser = newUser;
    next();
  }

  // static async userLogin(req, res, next) {
  //   const { password, email } = req.body;
  //   try {
  //     const check = checkItem({
  //       email,
  //       password
  //     });
  //     if (Object.keys(check).length > 0) {
  //       return res.status(400).json({
  //         statusCode: 400,
  //         check
  //       });
  //     }
  //     const returnUser = await userModel.getUserBy({ email });

  //     if (returnUser && returnUser.password) {
  //       const checkPassword = await bcrypt.compareSync(
  //         password,
  //         returnUser.password
  //       );
  //       if (returnUser && checkPassword) {
  //         // eslint-disable-next-line require-atomic-updates
  //         req.checked = returnUser;
  //         next();
  //       }
  //     }

  //     return requestHandler.error(res, 400, 'wrong credentials');
  //   } catch (err) {
  //     return err;
  //   }
  // }
  static async userLogin(req, res, next) {
    const { password, email, role } = req.body;
    try {
      const check = checkItem({
        email,
        password,
        role

      });
      if (Object.keys(check).length > 0) {
        return res.status(400).json({
          statusCode: 400,
          check
        });
      }
      const returnUser = await userModel.getUserBy({ email });
  
      if (returnUser && returnUser.password && returnUser.role === role) {
        const checkPassword = await bcrypt.compareSync(
          password,
          returnUser.password
        );
        if (checkPassword) {
          req.checked = returnUser;
          next();
        }
      }
  
      return res.status(400).json({
        statusCode: 400,
        message: 'Wrong credentials or role'
      });
    } catch (err) {
      return res.status(500).json({
        statusCode: 500,
        message: 'Internal server error'
      });
    }
  }

  static async userProfile(req, res, next) {
    try {
      const { email, username, fullname, bio } = req.body;
      const check = checkItem({
        email,
        username,
        fullname,
        bio
      });
      if (Object.keys(check).length > 0) {
        return requestHandler.error(res, 400, check);
      }
      next();
    } catch (error) {
      return error;
    }
  }

  static async inviteInput(req, res, next) {
    try {
      const { email } = req.body;
      const { id } = req.params;
      const check = checkItem({
        email
      });
      if (Object.keys(check).length > 0) {
        return requestHandler.error(res, 400, check);
      }
      if (id) {
        next();
      }
      const checkUser = await userModel.getUserBy({ email });
      if (!checkUser || Object.keys(checkUser).length === 0) {
        return requestHandler.error(
          res,
          401,
          'This email is either incorrect or not registered'
        );
      }
      req.checked = { email: checkUser.email, id: checkUser.id };
      next();
    } catch (error) {
      return error;
    }
  }

  static async validateToken(req, res, next) {
    try {
      const token = await server.locals;
      if (token) {
        const { __uid } = decode(token);
        req.token = __uid;
        next();
      } else {
        return requestHandler.error(res, 400, `Email is invalid`);
      }
    } catch (error) {
      return error;
    }
  }
};
