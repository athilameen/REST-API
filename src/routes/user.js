const express = require("express");
const router = express.Router();

const UserController = require('../controllers/user');
const checkAuth = require('../middleware/check-auth');

router.post("/signup", UserController.userSignup);

router.post("/login", UserController.userLogin);

router.post("/token", UserController.refreshToken);

router.post("/logout", checkAuth, UserController.logoutUser);

router.patch("/profile", checkAuth, UserController.updateProfile);

router.post("/change-password", checkAuth, UserController.changePassword);

router.post("/forgot-password", UserController.forgotPassword);

router.post("/reset-password/:token", UserController.resetPassword);

router.delete("/delete/:userId", checkAuth, UserController.userDelete);

module.exports = router;
