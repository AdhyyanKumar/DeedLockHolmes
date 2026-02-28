const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiService {
  
  constructor() {
    this.model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
    });
  }

  /**
   * Analyze property with transaction history
   */
  async analyzeProperty(propertyData, transactionHistory = []) {
    try {
      console.log('Analyzing property with Gemini AI...');
      
      const historyText = transactionHistory.length > 0
        ? transactionHistory.map(t => `
          - Date: ${new Date(t.CREATED_AT).toLocaleDateString()}
          - Owner: ${t.OWNER_NAME}
          - Price: $${t.SALE_PRICE.toLocaleString()}
        `).join('\n')
        : 'No transaction history available.';

      const prompt = `
        Analyze this property and provide investment insights:
        
        Property Details:
        - Address: ${propertyData.address}
        - Current Owner: ${propertyData.ownerName}
        - Current Price: $${propertyData.salePrice.toLocaleString()}
        
        Transaction History:
        ${historyText}
        
        Provide a brief analysis covering:
        1. Price trend (appreciating/depreciating)
        2. Ownership stability
        3. Risk assessment
        4. Investment recommendation
        
        Keep response under 200 words, professional tone.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text();

      console.log('✓ Analysis generated');

      return {
        success: true,
        analysis: analysis,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('✗ Error analyzing with Gemini:', error);
      throw error;
    }
  }

  /**
   * Detect fraud risk
   */
  async detectFraudRisk(propertyData) {
    try {
      console.log('Detecting fraud risk with Gemini AI...');
      
      const prompt = `
        Analyze this property transaction for fraud indicators:
        
        Property ID: ${propertyData.propertyId}
        Address: ${propertyData.address}
        Owner: ${propertyData.ownerName}
        Sale Price: $${propertyData.salePrice.toLocaleString()}
        
        Evaluate:
        1. Price reasonableness (unusually low/high)
        2. Address format validity
        3. Owner information completeness
        4. Overall fraud likelihood
        
        Provide a fraud risk score (0-100) where:
        - 0-30: LOW risk
        - 31-70: MEDIUM risk
        - 71-100: HIGH risk
        
        Format response as: "Risk Score: XX/100 - [brief explanation]"
        Keep under 100 words.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const riskAnalysis = response.text();

      // Extract risk score
      const scoreMatch = riskAnalysis.match(/Risk Score:\s*(\d+)/i);
      const riskScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;

      const riskLevel = riskScore < 31 ? 'LOW' : riskScore < 71 ? 'MEDIUM' : 'HIGH';

      console.log(`✓ Fraud risk detected: ${riskLevel} (${riskScore}/100)`);

      return {
        success: true,
        riskScore: riskScore,
        riskLevel: riskLevel,
        analysis: riskAnalysis,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('✗ Error detecting fraud with Gemini:', error);
      throw error;
    }
  }

  /**
   * Generate property description
   */
  async generatePropertyDescription(propertyData) {
    try {
      console.log('Generating property description with Gemini AI...');
      
      const prompt = `
        Write a professional property listing description for:
        
        Address: ${propertyData.address}
        Price: $${propertyData.salePrice.toLocaleString()}
        
        Highlights:
        - Blockchain-verified authenticity (tamper-proof records)
        - Location benefits
        - Investment potential
        
        Tone: Professional, trustworthy, modern
        Length: 100-150 words
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const description = response.text();

      console.log('✓ Description generated');

      return {
        success: true,
        description: description,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('✗ Error generating description with Gemini:', error);
      throw error;
    }
  }

  /**
   * Chat with property AI assistant
   */
  async chatWithProperty(propertyId, userQuestion, propertyData, context = []) {
    try {
      console.log('Processing chat with Gemini AI...');
      
      const conversationHistory = context.length > 0
        ? context.map(c => `${c.role}: ${c.message}`).join('\n')
        : 'No previous conversation.';

      const prompt = `
        You are an AI assistant for a blockchain property registry.
        
        Property Context:
        - Property ID: ${propertyData.propertyId}
        - Address: ${propertyData.address}
        - Owner: ${propertyData.ownerName}
        - Price: $${propertyData.salePrice.toLocaleString()}
        - Blockchain: Verified on Solana
        
        Conversation History:
        ${conversationHistory}
        
        User Question: ${userQuestion}
        
        Provide a helpful response about this property.
        If question is unrelated to the property, politely redirect.
        Keep response under 150 words.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();

      console.log('✓ Chat response generated');

      return {
        success: true,
        answer: answer,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('✗ Error in property chat with Gemini:', error);
      throw error;
    }
  }
}

module.exports = new GeminiService();
