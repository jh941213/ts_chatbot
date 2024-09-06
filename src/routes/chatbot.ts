import express from 'express';
import { generateResponse } from '../services/openai';

const router = express.Router();

router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: '메시지가 필요합니다.' });
  }

  try {
    const response = await generateResponse(message);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;