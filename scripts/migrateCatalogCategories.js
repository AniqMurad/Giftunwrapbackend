import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";

dotenv.config();

const APPLY = process.argv.includes("--apply");
const SOURCE_RELIGIOUS = "giftsForReligions";
const SOURCE_MIXED = "FlowersChocolates";
const TARGET_FLORAL = "floralArrangements";
const TARGET_SWEET = "sweetTreats";

const SWEET_TERMS = /\b(cake|cakes|chocolate|chocolates|brownie|brownies|cookie|cookies|dessert|desserts|candy|candies|truffle|truffles|confection|confections)\b|\bsweet treats?\b/i;
const FLORAL_TERMS = /\b(flower|flowers|floral|bouquet|bouquets|bloom|blooms|rose|roses|sunflower|sunflowers)\b/i;

const searchableText = (product) => [
  product.name,
  ...(Array.isArray(product.keyGift) ? product.keyGift : [product.keyGift]),
  product.subcategory,
  product.shortDescription,
  product.longDescription,
  product.metaTitle,
  product.metaDescription,
].filter(Boolean).join(" ");

const classifyMixedProduct = (product) => {
  const text = searchableText(product);
  const sweet = SWEET_TERMS.test(text);
  const floral = FLORAL_TERMS.test(text);
  return {
    floral: floral || !sweet,
    sweet,
  };
};

const mergeProducts = (existingProducts, incomingProducts) => {
  const merged = new Map();
  for (const product of [...existingProducts, ...incomingProducts]) {
    const key = Number.isFinite(Number(product.id)) ? `id:${product.id}` : `_id:${product._id}`;
    if (!merged.has(key)) merged.set(key, product);
  }
  return [...merged.values()];
};

const summarize = (products) => products.map((product) => ({ id: product.id, name: product.name }));

const main = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured.");
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });

  const sourceDocuments = await Product.find({
    category: { $in: [SOURCE_RELIGIOUS, SOURCE_MIXED] },
  }).lean();
  const targetDocuments = await Product.find({
    category: { $in: [TARGET_FLORAL, TARGET_SWEET] },
  }).lean();

  const byCategory = new Map([...sourceDocuments, ...targetDocuments].map((document) => [document.category, document]));
  const religiousProducts = byCategory.get(SOURCE_RELIGIOUS)?.products || [];
  const mixedProducts = byCategory.get(SOURCE_MIXED)?.products || [];
  const mixedClassification = mixedProducts.map((product) => ({ product, ...classifyMixedProduct(product) }));
  const floralIncoming = [
    ...religiousProducts,
    ...mixedClassification.filter((entry) => entry.floral).map((entry) => entry.product),
  ];
  const sweetIncoming = mixedClassification.filter((entry) => entry.sweet).map((entry) => entry.product);
  const floralProducts = mergeProducts(byCategory.get(TARGET_FLORAL)?.products || [], floralIncoming);
  const sweetProducts = mergeProducts(byCategory.get(TARGET_SWEET)?.products || [], sweetIncoming);

  console.log(JSON.stringify({
    mode: APPLY ? "apply" : "dry-run",
    source: {
      [SOURCE_RELIGIOUS]: summarize(religiousProducts),
      [SOURCE_MIXED]: mixedClassification.map(({ product, floral, sweet }) => ({
        id: product.id,
        name: product.name,
        destinations: [floral && TARGET_FLORAL, sweet && TARGET_SWEET].filter(Boolean),
      })),
    },
    resultCounts: {
      [TARGET_FLORAL]: floralProducts.length,
      [TARGET_SWEET]: sweetProducts.length,
    },
  }, null, 2));

  if (!APPLY) {
    console.log("Dry run only. Re-run with --apply after reviewing this plan.");
    return;
  }

  const backupPath = path.join(os.tmpdir(), `giftunwrap-category-backup-${Date.now()}.json`);
  await fs.writeFile(backupPath, JSON.stringify([...sourceDocuments, ...targetDocuments], null, 2));

  const collection = Product.collection;
  await collection.updateOne(
    { category: TARGET_FLORAL },
    { $set: { category: TARGET_FLORAL, products: floralProducts } },
    { upsert: true },
  );
  await collection.updateOne(
    { category: TARGET_SWEET },
    { $set: { category: TARGET_SWEET, products: sweetProducts } },
    { upsert: true },
  );

  const verification = await collection.find({ category: { $in: [TARGET_FLORAL, TARGET_SWEET] } }).toArray();
  const verificationByCategory = new Map(verification.map((document) => [document.category, document]));
  if ((verificationByCategory.get(TARGET_FLORAL)?.products || []).length !== floralProducts.length
    || (verificationByCategory.get(TARGET_SWEET)?.products || []).length !== sweetProducts.length) {
    throw new Error("Target verification failed; obsolete categories were not removed.");
  }

  await collection.deleteMany({ category: { $in: [SOURCE_RELIGIOUS, SOURCE_MIXED] } });
  console.log(`Migration complete. Recovery backup: ${backupPath}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
