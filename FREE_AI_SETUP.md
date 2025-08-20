# 🚀 Free AI Engine Setup Guide

## Get Free API Keys for Better AI Responses

Your Mentara app now uses multiple free AI engines for both text and image analysis. Here's how to get free API keys to improve reliability:

### 🔑 Replicate API (Recommended - 500 free requests/month)

1. **Sign up**: Go to [https://replicate.com/](https://replicate.com/)
2. **Get free token**: Visit [https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens)
3. **Copy token**: Your token starts with `r8_...`
4. **Add to environment**: Create a `.env.local` file in your project root:

```bash
REPLICATE_API_TOKEN=r8_your_actual_token_here
```

### 🎯 Benefits of Adding API Keys

**Without API Keys (Current):**
- ✅ Works completely free
- ❌ Rate limited (may get "having trouble" messages)
- ❌ Slower responses
- ❌ Less reliable

**With API Keys:**
- ✅ 500 free requests/month on Replicate
- ✅ No rate limiting
- ✅ Faster responses
- ✅ More reliable image analysis
- ✅ Better text generation

### 🆓 Alternative Free Services

**Hugging Face (30,000 free requests/month):**
- Sign up: [https://huggingface.co/](https://huggingface.co/)
- Get token: [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- Add: `HUGGINGFACE_API_TOKEN=hf_your_token_here`

### 📱 How to Use

1. **Text Questions**: Uses multiple AI engines with fallbacks
2. **Image Analysis**: Uses multimodal AI for visual content
3. **Smart Fallbacks**: Always provides helpful responses
4. **GCSE Maths Focus**: Specialized for mathematics education

### 🎉 Result

With free API keys, you'll get:
- **Reliable AI responses** for text questions
- **Accurate image analysis** for math problems
- **No more "having trouble" messages**
- **Professional-grade AI assistance**

### 💡 Pro Tips

- **Start with Replicate** - most generous free tier
- **Keep tokens secure** - don't share publicly
- **Monitor usage** - stay within free limits
- **Enjoy unlimited** GCSE Maths tutoring!

---

**Note**: All services work without API keys but with rate limits. Adding keys removes limits and improves reliability significantly!
