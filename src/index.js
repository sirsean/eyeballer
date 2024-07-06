import { Command } from "commander";
import { BlurbGenerator, StableDiffusionLightningImageGenerator } from "./ai/cloudflare.js";
import { ImagePrompt } from "./ai/prompt.js";
import { v4 as uuidv4 } from "uuid";
import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import express from "express";
import fs from "fs/promises";
import path, { dirname } from "path";
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from "http-proxy-middleware";
import sharp from 'sharp';
import Client from "@replit/database";
import { ok } from "assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// constants

const BUCKET = "eyeballer";
const HOSTNAME = "eyeballer.replit.app";

// database client

const db = new Client();

// R2 client
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// utility functions

async function getCurrentMaxTokenId() {
  return db.get("max_token_id")
    .then(({ ok, value }) => {
      if (!ok) {
        return 0;
      }
      return value;
    });
}

async function setCurrentMaxTokenId(id) {
  await db.set("max_token_id", id);
}

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function downloadMetadata(id) {
  const obj = await r2.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: `data/${id}.json`
  }));
  let data = "";
  for await (const chunk of obj.Body) {
    data += chunk;
  }
  return JSON.parse(data);
}

async function uploadImage(id, image) {
  const imageUpload = new Upload({
    client: r2,
    params: {
      Bucket: BUCKET,
      Key: `img/${id}.png`,
      Body: image,
    },
  });
  return imageUpload.done();
}

async function uploadThumbnail(id, image) {
  const imageUpload = new Upload({
    client: r2,
    params: {
      Bucket: BUCKET,
      Key: `thumb/${id}.png`,
      Body: image,
    },
  });
  return imageUpload.done();
}

async function uploadMetadata(id, metadata) {
  const metadataUpload = new Upload({
    client: r2,
    params: {
      Bucket: BUCKET,
      Key: `data/${id}.json`,
      Body: JSON.stringify(metadata),
    },
  });
  return metadataUpload.done();
}

async function listKeysByPrefix(prefix) {
  const keys = [];
  let isTruncated = true;
  let continuationToken = undefined;

  while (isTruncated) {
    try {
      const params = {
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken
      };
      const command = new ListObjectsV2Command(params);
      const response = await r2.send(command);

      // Log the keys of the objects found
      response.Contents.forEach((item) => {
        //console.log(item.Key);
        keys.push(item.Key);
      });

      // Check if there are more results
      isTruncated = response.IsTruncated;
      continuationToken = response.NextContinuationToken;
    } catch (error) {
      console.error('Error listing items in S3 bucket:', error);
      break;
    }
  }

  return keys;
}

async function generate(id) {
  const prompt = new ImagePrompt(id);
  const imageGenerator = new StableDiffusionLightningImageGenerator();
  const blurbGenerator = new BlurbGenerator(id);

  const [image, blurb] = await Promise.all([
    imageGenerator.generate(prompt.text()),
    blurbGenerator.generate(),
  ]);

  const metadata = {
    name: `Eyeballer ${id}`,
    description: blurb,
    image: `https://${HOSTNAME}/image/${id}.png`,
    attributes: [
      {
        trait_type: "iris",
        value: prompt.irisColor,
      },
      ...prompt.colors.map(color => ({
        trait_type: "color",
        value: color,
      })),
    ],
  };

  await Promise.all([
    uploadImage(id, image),
    uploadMetadata(id, metadata),
  ]);

  return {
    id,
  };
}

async function imgToThumbnail(id) {
  const obj = await r2.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: `img/${id}.png`
  }));
  const thumbnail = await streamToBuffer(obj.Body)
    .then(buffer => sharp(buffer))
    .then(img => img.resize(128, 128).toBuffer());
  return uploadThumbnail(id, thumbnail);
}

// webserver

const app = express();

// Middleware to catch async errors
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

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
  const obj = await r2.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: `img/${tokenId}.png`
  }));
  
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
  const obj = await r2.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: `thumb/${tokenId}.png`
  }));

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
  const obj = await r2.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: `data/${tokenId}.json`
  }));

  res.set('Content-Type', 'application/json');
  obj.Body.pipe(res);
}));

// api endpoints

app.get('/api/max-token-id', asyncHandler(async (req, res) => {
  const maxTokenId = await getCurrentMaxTokenId();
  res.json({ maxTokenId });
}));

// set up the UI server

if (process.env.NODE_ENV === "production") {
  // serve static files from vite-app
  app.use(express.static(path.join(__dirname, '..', 'dist')));
  
  // handle all other routes within vite-app
  app.get('*', asyncHandler(async (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }));
} else {
  // proxy vite development server
  app.use('/', createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
  }));
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// program commands

const program = new Command();

program
  .command("server")
  .description("Start the server")
  .action(async () => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  });

program
  .command("generate-all")
  .description("Generate all images and blurbs")
  .action(async () => {
    for (let id=4249; id <= 10000; id++) {
      console.log(id);
      
      let retries = 3;
      while (retries > 0) {
        try {
          await generate(id);
          break; // If successful, exit the loop
        } catch (error) {
          retries -= 1;
          console.error(`Failed to generate for id ${id}. Retries left: ${retries}`, error);
          if (retries === 0) throw error; // Rethrow the error if no retries are left
        }
      }
    }
    console.log('done');
  });

async function getTokenIds({ prefix, regex }) {
  const keys = await listKeysByPrefix(prefix);
  return keys.filter(key => regex.test(key))
    .map(key => parseInt(key.match(regex)[1]))
    .sort((a, b) => a - b);
}

program
  .command("counter")
  .action(async () => {
    const tokenIds = await getTokenIds({ prefix: "data/", regex: /^data\/(\d+)\.json$/ });
    console.log(tokenIds.length);
    console.log(tokenIds[0]);
    console.log(tokenIds[tokenIds.length - 1]);
  });

program
  .command("thumbnails")
  .description("Generate thumbnails")
  .action(async () => {
    /*
    const tokenIds = await getTokenIds({ prefix: "img/", regex: /^img\/(\d+)\.png$/ });
    for (const id of tokenIds) {
      console.log(id);
      await imgToThumbnail(id);
    }
    */
    for (let id=6441; id <= 10000; id++) {
      console.log(id);
      await imgToThumbnail(id);
    }
    console.log('done');
  });

program
  .command("replace-image")
  .description("Replace the image for an existing ID")
  .action(async () => {
    const id = 1647;
    const prompt = new ImagePrompt(id);
    const imageGenerator = new StableDiffusionLightningImageGenerator();
    const image = await imageGenerator.generate(prompt.text());
    await uploadImage(id, image);
    await imgToThumbnail(id);
    console.log('done');
  });

program
  .command("regenerate-blurb")
  .description("Regenerate the blurb for an existing ID")
  .action(async () => {
    const id = 23;
    const metadata = await downloadMetadata(id);
    const blurbGenerator = new BlurbGenerator(id);
    metadata.description = await blurbGenerator.generate();
    await uploadMetadata(id, metadata);
    console.log('done');
  });

program
  .command("replace-blurb")
  .description("Replace the blurb for an existing image")
  .action(async () => {
    const id = 23;
    const blurb = "I can tell you about a particular eyeball that was once the prized possession of a brilliant alchemist, who used its mystical powers to transmute base metals into rare gemstones and lived a life of luxurious extravagance in a candlelit mansion surrounded by a collection of oversized, gemstone-encrusted hourglasses.";
    
    const metadata = await downloadMetadata(id);
    
    metadata.description = blurb;
    
    await uploadMetadata(id, metadata);
    console.log('done');
  });

program
  .command("review-blurbs")
  .description("Review the existing blurbs")
  .action(async () => {
    const filename = path.join(__dirname, 'blurbs.txt');
    try {
      //await fs.unlink(filename);
    } catch (err) {
      if (err.code !== 'ENOENT') { // ignore the error if the file does not exist
        throw err;
      }
    }
    for (let id=5708; id <= 10000; id++) {
      console.log(id);
      const metadata = await downloadMetadata(id);
      await fs.appendFile(filename, `${id}\n${metadata.description}\n`);
    }
    console.log('done');
  });

program
  .command("blurb-parser")
  .description("Parse the existing blurbs")
  .action(async () => {
    const filename = path.join(__dirname, 'blurb3.txt');
    const outFilename = path.join(__dirname, 'blurb4.txt');
    const lines = (await fs.readFile(filename, 'utf-8')).split('\n');
    const tokenIds = lines.filter(line => /^\d+$/.test(line)).map(Number);
    console.log('total', tokenIds.length);
    for (const tokenId of tokenIds) {
      console.log(tokenId);
      const metadata = await downloadMetadata(tokenId);
      const bg = new BlurbGenerator(tokenId);
      metadata.description = await bg.generate();
      await uploadMetadata(tokenId, metadata);
      await fs.appendFile(outFilename, `${tokenId}\n${metadata.description}\n`);
    }
  });

program
  .command("generate")
  .description("Generate an eyeball")
  .action(async () => {
    const id = uuidv4();
    const result = await generate(id);
    console.log(result);
  });

program
  .command("blurb")
  .description("Generate a demo blurb")
  .action(async () => {
    const bg = new BlurbGenerator(uuidv4());
    const text = await bg.generate();
    console.log(text);
  });

program
  .command("img")
  .description("Generate a demo image")
  .action(async () => {
    console.log("demo...");
    const uuid = uuidv4();
    console.log(`Generated UUID: ${uuid}`);
    const prompt = new ImagePrompt(uuid);
    const ig = new StableDiffusionLightningImageGenerator();
    const img = await ig.generate(prompt.text());

    const upload = new Upload({
      client: r2,
      params: {
        Bucket: BUCKET,
        Key: `img/${uuid}.png`,
        Body: img,
      },
    });
    await upload.done();

    console.log("done");
  });

program
  .command("max-token")
  .description("Get the max token count")
  .action(async () => {
    const maxToken = await getCurrentMaxTokenId();
    console.log(maxToken);
    await setCurrentMaxTokenId(10000);
    console.log(await getCurrentMaxTokenId());
  });

await program.parseAsync(process.argv);
