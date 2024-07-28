import { downloadMetadata, uploadMetadata } from "../data/r2.js";

async function main() {
  for (let i = 1; i <= 10000; i++) {
    console.log(i);
    const metadata = await downloadMetadata(i);
    metadata.image = metadata.image.replace("eyeballer.replit.app", "eyeballer.sirsean.me");
    await uploadMetadata(i, metadata);
  }
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});