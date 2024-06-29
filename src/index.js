import { Command } from "commander";
import { BlurbGenerator, StableDiffusionLightningImageGenerator } from "./ai/cloudflare.js";
import { ImagePrompt } from "./ai/prompt.js";
import { v4 as uuidv4 } from "uuid";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from "http-proxy-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// constants

const BUCKET = "eyeballer";
const HOSTNAME = "eyeballer.replit.app";

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

  const imageUpload = new Upload({
    client: r2,
    params: {
      Bucket: BUCKET,
      Key: `img/${id}.png`,
      Body: image,
    },
  });
  const metadataUpload = new Upload({
    client: r2,
    params: {
      Bucket: BUCKET,
      Key: `data/${id}.json`,
      Body: JSON.stringify(metadata),
    },
  });

  await Promise.all([imageUpload.done(), metadataUpload.done()]);

  return {
    id,
  };
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

  // download the image from the S3 bucket
  const obj = await r2.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: `img/${id}.png`
  }));
  
  res.set('Content-Type', 'image/png');
  obj.Body.pipe(res);
}));

// serve the metadata
app.get('/metadata/:id.json', asyncHandler(async (req, res) => {
  const id = req.params.id;
  console.log(`get metadata ${id}`);

  // download the metadata from the S3 bucket
  const obj = await r2.send(new GetObjectCommand({
    Bucket: BUCKET,
    Key: `data/${id}.json`
  }));

  res.set('Content-Type', 'application/json');
  obj.Body.pipe(res);
}));

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
  res.status(500).json({ error: 'An unexpected error occurred' });
});

// program commands

const program = new Command();

program
  .command("server")
  .description("Start the server")
  .action(async () => {
    app.listen(process.env.PORT, () => {
      console.log(`Server listening on port ${process.env.PORT}`);
    });
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

await program.parseAsync(process.argv);
