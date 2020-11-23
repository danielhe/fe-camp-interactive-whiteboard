import express from "express";
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.sendFile('');
});

export default router;
