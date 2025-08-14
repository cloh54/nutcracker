import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.send("Hello from Express!");
});

export default router;