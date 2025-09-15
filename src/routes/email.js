var express = require("express");
var router = express.Router();
var emailController = require("../controllers/emailController");

// POST /email
router.post("/", emailController.enviarEmail);

module.exports = router;
