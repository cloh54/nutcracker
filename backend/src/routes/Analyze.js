import { AzureKeyCredential, DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import dotenv from 'dotenv';
import express from 'express';
import fs from "fs";
import multer from 'multer';
import path from 'path';
import Tesseract from 'tesseract.js';
import { fileURLToPath } from 'url';

const router = express.Router();
dotenv.config();

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
console.log(__filename)
const __dirname = path.dirname(__filename);
console.log(__dirname)

const app = express();
const upload = multer({ dest: 'uploads/' });

// Init Azure Document Intelligence client
const endpoint = process.env.AZURE_DI_ENDPOINT;
const key = process.env.AZURE_DI_KEY;
if (!endpoint || !key) {
    console.error("Missing AZURE_DI_ENDPOINT or AZURE_DI_KEY");
    process.exit(1);
}
const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));
const TEST = TRUE


router.post("/upload-receipt-azure", upload.single("receipt"), async (req, res) => {
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
                raw: result,
            };

            return res.json(payload);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to read result.json" });
        }
    }
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        // Read the uploaded image as a stream
        const stream = fs.createReadStream(req.file.path);

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
            items,
            // Full raw service response if you want to inspect everything
            raw: result,
        };

        res.json(payload);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Receipt analysis failed" });
    } finally {
        // optional: clean up uploaded file
        if (req?.file?.path) fs.unlink(req.file.path, () => { });
    }
});

router.post('/upload-receipt-tess', upload.single('receipt'), async (req, res) => {
    try {
        console.log('Received file:', req.file.path);
        // one day i'll fix this
        const imagePath = path.join(__dirname, '../../' + req.file.path);

        // OCR processing
        const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
        console.log('OCR Result:', text);

        // Example: extract total amount
        // Extract fields using regex patterns
        const merchantNameMatch = text.match(/(?:Store|Merchant|Name|Shop)\s*[:\-]?\s*(.+)/i);
        const merchantName = merchantNameMatch ? merchantNameMatch[1].trim() : null;

        const merchantPhoneMatch = text.match(/(?:Phone|Tel|Contact)\s*[:\-]?\s*([\d\-\(\)\s]+)/i);
        const merchantPhoneNumber = merchantPhoneMatch ? merchantPhoneMatch[1].trim() : null;

        const merchantAddressMatch = text.match(/(?:Address)\s*[:\-]?\s*(.+)/i);
        const merchantAddress = merchantAddressMatch ? merchantAddressMatch[1].trim() : null;

        const dateMatch = text.match(/(?:Date)\s*[:\-]?\s*([\d\/\-]+)/i);
        const transactionDate = dateMatch ? dateMatch[1].trim() : null;

        const timeMatch = text.match(/(?:Time)\s*[:\-]?\s*([\d:APMapm\s]+)/i);
        const transactionTime = timeMatch ? timeMatch[1].trim() : null;

        const subtotalMatch = text.match(/Subtotal\s*\$?([\d,.]+)/i);
        const subtotal = subtotalMatch ? subtotalMatch[1] : null;

        const totalTaxMatch = text.match(/(?:Tax|Total\s*Tax)\s*\$?([\d,.]+)/i);
        const totalTax = totalTaxMatch ? totalTaxMatch[1] : null;

        const tipMatch = text.match(/Tip\s*\$?([\d,.]+)/i);
        const tip = tipMatch ? tipMatch[1] : null;

        const totalMatch = text.match(/Total\s*\$?([\d,.]+)/i);
        const total = totalMatch ? totalMatch[1] : null;

        // Attempt to extract items (very basic, line by line)
        const items = [];
        const itemLines = text.split('\n').filter(line =>
            /[a-zA-Z]/.test(line) && /[\d,.]+/.test(line) && !/Total|Subtotal|Tax|Tip/i.test(line)
        );
        itemLines.forEach(line => {
            const itemMatch = line.match(/(.+?)\s+([\d,.]+)$/);
            if (itemMatch) {
                items.push({
                    description: itemMatch[1].trim(),
                    price: itemMatch[2].trim()
                });
            }
        });

        // Return all extracted fields
        res.json({
            merchantName,
            merchantPhoneNumber,
            merchantAddress,
            transactionDate,
            transactionTime,
            subtotal,
            totalTax,
            tip,
            total,
            items,
            rawText: text
        });

        res.json({
            rawText: text,
            total: total || 'Not found'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error reading receipt' });
    }
});


export default router;