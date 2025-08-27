# Google Cloud Vision API Setup Guide

## 🎯 **Real OCR Implementation**

This guide will help you set up Google Cloud Vision API for real OCR text detection in the homework marking system.

## 📋 **Prerequisites**

1. **Google Cloud Account** - You need a Google Cloud account
2. **Billing Enabled** - Google Cloud Vision API requires billing to be enabled
3. **Project Created** - A Google Cloud project to organize your resources

## 🚀 **Setup Steps**

### **Step 1: Create Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "homework-ocr-system")
4. Click "Create"

### **Step 2: Enable Vision API**

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Cloud Vision API"
3. Click on "Cloud Vision API"
4. Click "Enable"

### **Step 3: Create Service Account**

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Enter name: "homework-ocr-service"
4. Click "Create and Continue"
5. For roles, select "Cloud Vision API User"
6. Click "Done"

### **Step 4: Download Credentials**

1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Download the JSON file

### **Step 5: Configure Environment**

1. Rename the downloaded file to `google-credentials.json`
2. Place it in your project root directory
3. Add to `.env.local`:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
```

### **Step 6: Test the System**

1. Restart your Next.js server
2. Upload a math homework image
3. Check the terminal for detailed OCR logs

## 🔍 **What You'll See in Terminal**

With real OCR enabled, you'll see detailed logs like:

```
🔍 Google Cloud Vision OCR Results:
🔍 Total text blocks detected: 15
🔍 Average confidence: 0.892
🔍 All detected text:
  Text 1: "2x + 3 = 7" (confidence: 0.945)
  Text 2: "x = 2" (confidence: 0.876)
  Text 3: "Correct!" (confidence: 0.923)
  ...
🔍 Combined text: 2x + 3 = 7 x = 2 Correct! 3y - 1 = 8 y = 3...
```

## 💰 **Costs**

- **First 1000 requests/month**: FREE
- **Additional requests**: $1.50 per 1000 requests
- **Typical homework image**: 1 request

## 🛠️ **Fallback Behavior**

If Google Cloud Vision is not configured:
- System automatically falls back to sample text
- No errors or crashes
- Graceful degradation

## 🔧 **Troubleshooting**

### **"Credentials not found"**
- Check `GOOGLE_APPLICATION_CREDENTIALS` path
- Ensure JSON file exists and is readable

### **"API not enabled"**
- Go to Google Cloud Console
- Enable Cloud Vision API for your project

### **"Billing not enabled"**
- Enable billing in Google Cloud Console
- Vision API requires billing to be active

## 🎉 **Benefits of Real OCR**

1. **Accurate Text Detection** - Real text from your images
2. **Precise Bounding Boxes** - Exact coordinates for annotations
3. **Confidence Scores** - Know how reliable each detection is
4. **Professional Quality** - Production-ready OCR system
5. **Detailed Logging** - See exactly what was detected

## 📱 **Next Steps**

Once configured:
1. Upload real math homework images
2. See actual detected text in terminal logs
3. Get precise bounding boxes for annotations
4. Experience professional-grade OCR accuracy

---

**Need help?** Check Google Cloud documentation or contact support.
