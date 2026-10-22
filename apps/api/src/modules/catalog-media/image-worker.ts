// Fixed worker program: no request content is interpreted as code, paths or URLs.
export const IMAGE_WORKER = String.raw`
const sharp = require(process.argv[1]);
sharp.cache(false); sharp.concurrency(1);
const chunks = []; let bytes = 0;
process.stdin.on('data', chunk => { bytes += chunk.length; if (bytes > 8388608) process.exit(2); chunks.push(chunk); });
process.stdin.on('end', async () => {
  try {
    const input = Buffer.concat(chunks);
    const options = { failOn: 'warning', limitInputPixels: 16000000, limitInputChannels: 4, sequentialRead: true };
    const metadata = await sharp(input, options).metadata();
    if (!['jpeg','png','webp'].includes(metadata.format) || (metadata.pages || 1) !== 1 || !metadata.width || !metadata.height ||
        metadata.width > 8192 || metadata.height > 8192 || metadata.width * metadata.height > 16000000) throw new Error();
    const derivatives = [];
    for (const [variant, size] of [['preview',1600],['thumbnail',400]]) {
      const {data,info} = await sharp(input, options).autoOrient().toColourspace('srgb')
        .resize({width:size,height:size,fit:'inside',withoutEnlargement:true}).webp({quality:82,effort:4})
        .timeout({seconds:5}).toBuffer({resolveWithObject:true});
      if (data.length > 2097152) throw new Error();
      derivatives.push({variant,width:info.width,height:info.height,data:data.toString('base64')});
    }
    process.stdout.write(JSON.stringify({format:metadata.format,width:metadata.width,height:metadata.height,derivatives}));
  } catch { process.exitCode = 2; }
});
`;
