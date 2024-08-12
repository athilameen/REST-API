const express = require("express");
const router = express.Router();

const UserController = require('../controllers/user');
const checkAuth = require('../middleware/check-auth');

router.post("/signup", UserController.userSignup);

router.post("/login", UserController.userLogin);

router.post("/token", UserController.refreshToken);

router.post("/logout", checkAuth, UserController.logoutUser);

router.delete("/delete/:userId", checkAuth, UserController.userDelete);

module.exports = router;
