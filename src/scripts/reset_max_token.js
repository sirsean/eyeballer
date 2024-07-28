import { getCurrentMaxTokenId, setCurrentMaxTokenId } from "../data/db.js";

async function main() {
  const newMaxTokenId = parseInt(process.env.MAX_TOKEN_ID);
  if (isNaN(newMaxTokenId)) {
    console.error('Please provide a valid tokenId value.');
    process.exit(1);
  }
  
  const maxToken = await getCurrentMaxTokenId();
  console.log('Current Max Token:', maxToken);
  console.log('New Max Token:', newMaxTokenId);
  await setCurrentMaxTokenId(newMaxTokenId);
  console.log('Done');
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});