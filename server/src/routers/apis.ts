import express from "express";
const router = express.Router();
import { rooms, users } from '../store';

/* GET users listing. */
router.get('/users', function(req, res, next) {
  res.json(users.toJSON())
});

/* GET rooms listing. */
router.get('/rooms', function(req, res, next) {
  res.json(rooms.toJSON())
});

export default router;
