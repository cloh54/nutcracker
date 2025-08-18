import express from 'express';
import analyzeRoutes from './routes/Analyze.js';
const app = express()
app.use(express.json({ limit: '10mb' }))
const port = process.env.PORT || 3000;

app.use('/analyze', analyzeRoutes)

app.get('/', (req, res) => {
  res.send('Welcome to Nutcracker API!');
});

app.listen(port, () => {
  console.log('Listening on port 3000: http://localhost:3000')
})