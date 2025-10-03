import app from './app';

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const host = '0.0.0.0';
app.listen(port, host, () => {
  console.log(`Backend running on http://${host}:${port}`);
});
