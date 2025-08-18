import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import dotenv from 'dotenv';
import express from 'express';
import fs from "fs";
import path from 'path';
import sharp from 'sharp';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';

const router = express.Router();
dotenv.config();

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
console.log(__filename)
const __dirname = path.dirname(__filename);
console.log(__dirname)

// Init Azure Document Intelligence client
const endpoint = process.env.AZURE_DI_ENDPOINT;
const key = process.env.AZURE_DI_KEY;
if (!endpoint || !key) {
    console.error("Missing AZURE_DI_ENDPOINT or AZURE_DI_KEY");
    process.exit(1);
}
const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
const TEST = true;


router.post("/upload-receipt-azure", async (req, res) => {
    if (TEST) {
        try {
            const resultPath = path.join(__dirname, '../../result.json');
            const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));

            const doc = result.documents?.[0];
            const f = (name) => doc?.fields?.[name]?.value ?? null;

            const items = (doc?.fields?.Items?.values ?? []).map((it) => {
                const fields = it?.properties ?? {};
                const v = (n) => fields[n]?.value ?? null;
                return {
                    description: v("Description"),
                    quantity: v("Quantity"),
                    price: v("Price"),
                    totalPrice: v("TotalPrice"),
                };
            });

            const payload = {
                merchantName: f("MerchantName"),
                merchantPhoneNumber: f("MerchantPhoneNumber"),
                merchantAddress: f("MerchantAddress"),
                transactionDate: f("TransactionDate"),
                transactionTime: f("TransactionTime"),
                subtotal: f("Subtotal"),
                totalTax: f("TotalTax"),
                tip: f("Tip"),
                total: f("Total"),
                items,
            };

            return res.json(payload);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to read result.json" });
        }
    }
    try {
        const base64 = req.body.receipt;
        if (!base64) return res.status(400).json({ error: "No base64 data uploaded" });

        // Convert base64 to buffer
        const buffer = Buffer.from(base64, 'base64');

        // Resize image using sharp (max width/height 1200px, JPEG quality 80)
        const resizedBuffer = await sharp(buffer)
            .resize({ width: 1200, height: 1200, fit: 'inside' })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Save resized image to disk
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }
        const imagePath = path.join(uploadsDir, 'last_receipt.jpg');
        fs.writeFileSync(imagePath, resizedBuffer);

        // Create a readable stream from resized buffer
        const stream = Readable.from(resizedBuffer);

        // Analyze with the prebuilt receipt model
        const poller = await client.beginAnalyzeDocument("prebuilt-receipt", stream);
        const result = await poller.pollUntilDone();

        // Extract some common fields if present
        const doc = result.documents?.[0];
        const f = (name) => doc?.fields?.[name]?.value ?? null;

        // Items array: each has fields like Description, Quantity, Price, TotalPrice (when available)
        const items = (doc?.fields?.Items?.values ?? []).map((it) => {
            const fields = it?.properties ?? {};
            const v = (n) => fields[n]?.value ?? null;
            return {
                description: v("Description"),
                quantity: v("Quantity"),
                price: v("Price"),
                totalPrice: v("TotalPrice"),
            };
        });

        const payload = {
            merchantName: f("MerchantName"),
            merchantPhoneNumber: f("MerchantPhoneNumber"),
            merchantAddress: f("MerchantAddress"),
            transactionDate: f("TransactionDate"),
            transactionTime: f("TransactionTime"),
            subtotal: f("Subtotal"),
            totalTax: f("TotalTax"),
            tip: f("Tip"),
            total: f("Total"),
            items
        };
        console.log(payload);
        res.json(payload);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Receipt analysis failed" });
    }

});


// Route to serve the last uploaded receipt image
router.get('/last-receipt-image', (req, res) => {
    const imagePath = path.join(__dirname, '../../uploads/last_receipt.jpg');
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).send('No receipt image found');
    }
});

export default router;