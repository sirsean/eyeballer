import express from "express";
import { asyncHandler } from "./middleware.js";
import { getCurrentMaxTokenId, setCurrentMaxTokenId } from "../data/db.js";
import { getObject } from "../data/r2.js";
import { ethers } from "ethers";
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// webserver

const app = express();

// serve the images
app.get('/image/:id.png', asyncHandler(async (req, res) => {
  const id = req.params.id;
  console.log(`get image ${id}`);

  const tokenId = parseInt(id);
  if (isNaN(tokenId)) {
    res.status(400).json({ error: "Invalid token ID" });
    return;
  }

  const maxTokenId = await getCurrentMaxTokenId();
  if (tokenId > maxTokenId) {
    res.status(400).json({ error: "Token not minted yet" });
    return;
  }

  // download the image from the S3 bucket
  const obj = await getObject(`img/${tokenId}.png`);

  res.set('Content-Type', 'image/png');
  obj.Body.pipe(res);
}));

// each image has a thumbnail
app.get('/thumb/:id.png', asyncHandler(async (req, res) => {
  const id = req.params.id;
  console.log(`get thumbnail ${id}`);

  const tokenId = parseInt(id);
  if (isNaN(tokenId)) {
    res.status(400).json({ error: "Invalid token ID" });
    return;
  }

  const maxTokenId = await getCurrentMaxTokenId();
  if (tokenId > maxTokenId) {
    res.status(400).json({ error: "Token not minted yet" });
    return;
  }

  // download the image from the S3 bucket
  const obj = await getObject(`thumb/${tokenId}.png`);

  res.set('Content-Type', 'image/png');
  obj.Body.pipe(res);
}));

// serve the metadata
app.get('/metadata/:id.json', asyncHandler(async (req, res) => {
  const id = req.params.id;
  console.log(`get metadata ${id}`);

  const tokenId = parseInt(id);
  if (isNaN(tokenId)) {
    res.status(400).json({ error: "Invalid token ID" });
    return;
  }

  const maxTokenId = await getCurrentMaxTokenId();
  if (tokenId > maxTokenId) {
    res.status(400).json({ error: "Token not minted yet" });
    return;
  }

  // download the metadata from the S3 bucket
  const obj = await getObject(`data/${tokenId}.json`);

  res.set('Content-Type', 'application/json');
  obj.Body.pipe(res);
}));

// api endpoints

app.post('/api/:id/check', asyncHandler(async (req, res) => {
  const id = req.params.id;
  console.log(`check ${id}`);

  const tokenId = parseInt(id);
  if (isNaN(tokenId)) {
    res.status(400).json({ error: "Invalid token ID" });
    return;
  }

  const maxTokenId = await getCurrentMaxTokenId();
  if (tokenId <= maxTokenId) {
    res.json({ ok: true });
    return;
  }
  
  const address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const eyeballer = await fs.readFile(path.join(__dirname, '..', 'abi', 'EyeballerABI.json'), 'utf8').then(JSON.parse);
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(address, eyeballer.abi, provider);

  const totalSupply = await contract.totalSupply();

  if (totalSupply > maxTokenId) {
    setCurrentMaxTokenId(totalSupply);
  }

  if (tokenId > totalSupply) {
    res.status(400).json({ error: "Token not minted yet" });
    return;
  }

  res.json({ ok: true });
}));

app.get('/api/max-token-id', asyncHandler(async (req, res) => {
  const maxTokenId = await getCurrentMaxTokenId();
  res.json({ maxTokenId });
}));

export default app;