# HumanFortress AI Video Lead Generation System - Complete Setup Guide

## 🚀 Quick Setup Checklist

### ✅ Already Completed:
- [x] Shotstack API key created and configured
- [x] OpenAI API credentials configured
- [x] Basic workflow structure created

### 🔄 Still Need:
- [ ] Google Sheets document setup
- [ ] Google Gemini API key setup
- [ ] Workflow configuration updates
- [ ] Test execution
- [ ] Activate workflow

---

## 📊 Step 1: Google Sheets Setup

### Create the Google Sheets Document:

1. **Go to Google Sheets**: https://sheets.google.com
2. **Create a new spreadsheet** named "HumanFortress Video Tracking"
3. **Create a sheet** named "Generated Videos"
4. **Set up columns**:
   - Column A: `videoUrl`
   - Column B: `companyName`
   - Column C: `createdDate`
   - Column D: `videoType`

### Get the Document ID:
1. Look at the URL: `https://docs.google.com/spreadsheets/d/[DOCUMENT_ID]/edit`
2. Copy the `[DOCUMENT_ID]` part
3. **Example**: If URL is `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
4. **Document ID**: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

---

## 🔑 Step 2: Google Gemini API Key Setup

### Create Gemini API Key:

1. **Go to Google AI Studio**: https://aistudio.google.com
2. **Sign in** with your Google account
3. **Click "Get API Key"** in the sidebar or bottom left
4. **Click "Create API Key"**
5. **Choose "Create API Key in new project"**
6. **Copy the API key** (save it securely)

### Set Up Billing (Required):
1. In Google AI Studio, go to your project
2. Click on "Billing" or "Payment methods"
3. Add a payment method (Google gives free credits)
4. **Note**: Gemini has generous free tier, but billing setup is required

---

## ⚙️ Step 3: Configure n8n Workflow

### Update Workflow Configuration:

1. **Open your n8n workflow**: "HumanFortress AI Video Lead Generation and Upload System"
2. **Update these nodes**:

#### Schedule Trigger Node:
- **Cron Expression**: `0 9 * * 1` (Every Monday at 9 AM)

#### Workflow Configuration Node:
- **companyName**: `HumanFortress.io`
- **companyWebsite**: `https://humanfortress.io`
- **companyAddress**: `123 Security Blvd, Cyber City, CA 90210`
- **logoUrl**: `https://humanfortress.io/logo.png`
- **videoType**: `lead generation advertising`

#### Stitch Videos and Add Audio Node:
- **URL**: `https://api.shotstack.io/stage/render`
- **Method**: POST
- **Headers**: Content-Type = application/json
- **Authentication**: Select "Shotstack API Key" credential
- **Body**: Use the Shotstack JSON template (already configured)

#### Upload to Google Sheets Node:
- **Document ID**: Your Google Sheets document ID
- **Sheet Name**: `Generated Videos`
- **Authentication**: Set up Google Sheets credentials

#### Generate Image with Nano Banana Node:
- **Authentication**: Add your Gemini API key credential

---

## 🔐 Step 4: Set Up n8n Credentials

### Google Sheets Credentials:
1. In n8n, go to **Credentials** → **Add Credential**
2. Select **Google Sheets OAuth2**
3. Follow the OAuth setup process
4. Grant access to your Google account

### Google Gemini Credentials:
1. In n8n, go to **Credentials** → **Add Credential**
2. Select **Header Auth** or **API Key** authentication
3. **Header Name**: `x-goog-api-key`
4. **API Key**: Your Gemini API key
5. **Name**: `Google Gemini API`

---

## 🧪 Step 5: Test the Workflow

### Manual Test Execution:
1. **Click "Execute Workflow"** in n8n
2. **Watch the execution** step by step
3. **Check for errors** in each node
4. **Verify output** in Google Sheets

### Common Issues to Check:
- [ ] All API credentials are properly configured
- [ ] Google Sheets document is accessible
- [ ] Shotstack API key is working
- [ ] Gemini API key has billing setup
- [ ] All placeholder values are replaced

---

## 📱 Step 6: Activate the Workflow

### Final Activation:
1. **Click the toggle** to activate the workflow
2. **Verify the schedule** is set correctly
3. **Monitor first automatic execution**
4. **Check results** in Google Sheets

---

## 🎯 Expected Results

### What the Workflow Produces:
- **AI-generated video** (16-45 seconds)
- **Professional security-themed images**
- **Voiceover audio** for the video
- **Combined video** with all elements
- **Tracking data** in Google Sheets

### Sample Output in Google Sheets:
| videoUrl | companyName | createdDate | videoType |
|----------|-------------|-------------|-----------|
| https://shotstack... | HumanFortress.io | 2026-01-24T15:30:00Z | lead generation advertising |

---

## 🆘 Troubleshooting

### Common Solutions:
1. **Shotstack API Error**: Check API key and endpoint URL
2. **Gemini API Error**: Verify billing is set up
3. **Google Sheets Error**: Check OAuth permissions
4. **Missing Data**: Verify all placeholder values are replaced

### Getting Help:
- Check n8n execution logs
- Verify API key permissions
- Test each node individually
- Check Google Sheets sharing settings

---

## 📈 Next Steps

### After Setup is Complete:
1. **Monitor first few executions**
2. **Adjust video prompts** if needed
3. **Fine-tune scheduling** (change from weekly to daily if desired)
4. **Add error handling** and notifications
5. **Expand to multiple companies** or video types

---

## 🎉 You're Ready to Go!

Once you complete these steps, your HumanFortress AI video generation system will be fully automated and ready to create professional lead generation videos every week!
