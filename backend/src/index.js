import express from 'express'
import analyzeRoutes from './routes/Analyze.js'
const app = express()
const PORT = 3000

app.use('/analyze', analyzeRoutes)

app.listen(PORT, () => {
  console.log('Listening on port 3000')
})